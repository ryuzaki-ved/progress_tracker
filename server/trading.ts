import express from 'express';
import db from './db.js';
import { authenticateToken, checkMaintenanceMode } from './middleware.js';
import { generateWeeklyOptionsContracts, calculateOptionPrice } from '../src/utils/optionUtils.js';

function checkAndApplyHedge(
  userId: number,
  pendingTrade: { contractId: number, type: string, quantity: number, premium: number },
  currentIndexValue: number,
  autoHedge: boolean
) {
  const holdings = db.prepare('SELECT * FROM user_options_holdings WHERE user_id = ?').all(userId) as any[];
  let bullishPremium = 0, bearishPremium = 0;

  if (pendingTrade.type === 'long_ce' || pendingTrade.type === 'short_pe') {
    bullishPremium += pendingTrade.premium * pendingTrade.quantity;
  } else {
    bearishPremium += pendingTrade.premium * pendingTrade.quantity;
  }

  for (const h of holdings) {
    const contract = db.prepare('SELECT * FROM options_contracts WHERE id = ?').get(h.contract_id) as any;
    const currPremium = calculateOptionPrice(
      currentIndexValue || contract.underlying_index_value_at_creation,
      contract.strike_price,
      contract.expiry_date,
      contract.option_type,
      contract.created_at
    );
    const val = currPremium * h.quantity;
    if (h.type === 'long_ce' || h.type === 'short_pe') bullishPremium += val;
    else bearishPremium += val;
  }

  const THRESHOLD = 1000000000;
  let dominant = 0, secondary = 0;
  let needsHedgeFor: 'bullish' | 'bearish' | null = null;
  
  if (bullishPremium > THRESHOLD && bearishPremium < 0.4 * bullishPremium) {
    dominant = bullishPremium; secondary = bearishPremium; needsHedgeFor = 'bearish';
  } else if (bearishPremium > THRESHOLD && bullishPremium < 0.4 * bearishPremium) {
    dominant = bearishPremium; secondary = bullishPremium; needsHedgeFor = 'bullish';
  }

  if (needsHedgeFor) {
    if (!autoHedge) throw new Error('Hedge requirement not met. Net exposure > 100 crores requires at least 40% opposite view hedge.');
    
    let missingPremium = Math.ceil((0.4 * dominant) - secondary);
    if (missingPremium <= 0) return { hedges: [], missingPremium: 0 };

    const tradeContract = db.prepare('SELECT * FROM options_contracts WHERE id = ?').get(pendingTrade.contractId) as any;
    const baseATM = Math.round((currentIndexValue || tradeContract.underlying_index_value_at_creation) / 100) * 100;
    const s = tradeContract.strike_price;
    const idealHedgeStrike = baseATM - (s - baseATM);

    const allOptions = db.prepare('SELECT DISTINCT strike_price FROM options_contracts WHERE expiry_date = ?').all(tradeContract.expiry_date) as any[];
    if (allOptions.length === 0) throw new Error('No hedge contracts available.');
    
    let hedgeStrike = idealHedgeStrike;
    if (!allOptions.some(o => o.strike_price === idealHedgeStrike)) {
      hedgeStrike = allOptions.reduce((prev, curr) => Math.abs(curr.strike_price - idealHedgeStrike) < Math.abs(prev.strike_price - idealHedgeStrike) ? curr : prev).strike_price;
    }

    const ceContract = db.prepare('SELECT * FROM options_contracts WHERE strike_price = ? AND option_type = ? AND expiry_date = ?').get(hedgeStrike, 'CE', tradeContract.expiry_date) as any;
    const peContract = db.prepare('SELECT * FROM options_contracts WHERE strike_price = ? AND option_type = ? AND expiry_date = ?').get(hedgeStrike, 'PE', tradeContract.expiry_date) as any;

    if (!ceContract || !peContract) throw new Error('Hedge contracts not found.');

    const cePremium = calculateOptionPrice(currentIndexValue || tradeContract.underlying_index_value_at_creation, ceContract.strike_price, ceContract.expiry_date, ceContract.option_type, ceContract.created_at);
    const pePremium = calculateOptionPrice(currentIndexValue || tradeContract.underlying_index_value_at_creation, peContract.strike_price, peContract.expiry_date, peContract.option_type, peContract.created_at);

    const halfHedgeTarget = missingPremium / 2;
    const cashRow = db.prepare('SELECT cash_balance FROM user_settings WHERE user_id = ?').get(userId) as any;
    const currentCash = cashRow.cash_balance;

    if (needsHedgeFor === 'bearish') {
      const longPeQty = Math.max(1, Math.ceil(halfHedgeTarget / pePremium));
      const shortCeQty = Math.max(1, Math.ceil(halfHedgeTarget / cePremium));
      
      const reqCash = (longPeQty * pePremium) + (shortCeQty * ceContract.strike_price) - (shortCeQty * cePremium);
      if (currentCash < reqCash) throw new Error('Insufficient cash balance to place auto-hedge (Long PE & Short CE).');
      
      return { hedges: [
        { contractId: peContract.id, type: 'long_pe', baseType: 'buy', quantity: longPeQty, premium: pePremium, reqCash: longPeQty * pePremium },
        { contractId: ceContract.id, type: 'short_ce', baseType: 'write', quantity: shortCeQty, premium: cePremium, reqCash: (shortCeQty * ceContract.strike_price) - (shortCeQty * cePremium) }
      ], missingPremium };
    } else {
      const longCeQty = Math.max(1, Math.ceil(halfHedgeTarget / cePremium));
      const shortPeQty = Math.max(1, Math.ceil(halfHedgeTarget / pePremium));
      
      const reqCash = (longCeQty * cePremium) + (shortPeQty * peContract.strike_price) - (shortPeQty * pePremium);
      if (currentCash < reqCash) throw new Error('Insufficient cash balance to place auto-hedge (Long CE & Short PE).');
      
      return { hedges: [
        { contractId: ceContract.id, type: 'long_ce', baseType: 'buy', quantity: longCeQty, premium: cePremium, reqCash: longCeQty * cePremium },
        { contractId: peContract.id, type: 'short_pe', baseType: 'write', quantity: shortPeQty, premium: pePremium, reqCash: (shortPeQty * peContract.strike_price) - (shortPeQty * pePremium) }
      ], missingPremium };
    }
  }
  return { hedges: [], missingPremium: 0 };
}

const router = express.Router();
router.use(authenticateToken);

// --- STOCKS & CASH ---

router.get('/cash', (req: any, res) => {
  const userId = req.user.id;
  try {
    let row = db.prepare('SELECT cash_balance FROM user_settings WHERE user_id = ?').get(userId) as any;
    if (!row) {
      db.prepare('INSERT INTO user_settings (user_id, cash_balance) VALUES (?, ?)').run(userId, 10000000);
      row = { cash_balance: 10000000 };
    }
    res.json({ data: row.cash_balance });
  } catch(err:any) { res.status(500).json({ error: err.message }); }
});

router.post('/add-funds', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { amount } = req.body;
  try {
    db.prepare('UPDATE user_settings SET cash_balance = cash_balance + ? WHERE user_id = ?').run(amount, userId);
    res.json({ data: true });
  } catch(err:any) { res.status(500).json({ error: err.message }); }
});

router.get('/holdings', (req: any, res) => {
  const userId = req.user.id;
  try {
    const rows = db.prepare('SELECT * FROM user_holdings WHERE user_id = ?').all(userId) as any[];
    res.json({ data: rows });
  } catch(err:any) { res.status(500).json({ error: err.message }); }
});

router.get('/transactions', (req: any, res) => {
  const userId = req.user.id;
  try {
    const rows = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC').all(userId) as any[];
    res.json({ data: rows });
  } catch(err:any) { res.status(500).json({ error: err.message }); }
});

router.post('/buy-stock', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { stockId, quantity, price } = req.body;
  try {
    const totalCost = (quantity * price) + Math.max(20, (quantity * price) * 0.0003);
    const tx = db.transaction(() => {
      const cashRow = db.prepare('SELECT cash_balance FROM user_settings WHERE user_id = ?').get(userId) as any;
      if (cashRow.cash_balance < totalCost) throw new Error('Insufficient cash balance');
      db.prepare('UPDATE user_settings SET cash_balance = cash_balance - ? WHERE user_id = ?').run(totalCost, userId);
      const holding = db.prepare('SELECT * FROM user_holdings WHERE user_id = ? AND stock_id = ?').get(userId, stockId) as any;
      if (holding) {
        const newQty = holding.quantity + quantity;
        const newAvg = ((holding.quantity * holding.weighted_avg_buy_price) + (quantity * price)) / newQty;
        db.prepare('UPDATE user_holdings SET quantity = ?, weighted_avg_buy_price = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newQty, newAvg, holding.id);
      } else {
        db.prepare('INSERT INTO user_holdings (user_id, stock_id, quantity, weighted_avg_buy_price, created_at) VALUES (?, ?, ?, ?, datetime(\'now\'))').run(userId, stockId, quantity, price);
      }
      db.prepare('INSERT INTO transactions (user_id, stock_id, type, quantity, price, brokerage_fee, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'))').run(userId, stockId, 'buy', quantity, price, Math.max(20, (quantity * price) * 0.0003));
    });
    tx();
    res.json({ data: true });
  } catch(err:any) { res.status(500).json({ error: err.message }); }
});

router.post('/sell-stock', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { stockId, quantity, price } = req.body;
  try {
    const tx = db.transaction(() => {
        const holding = db.prepare('SELECT * FROM user_holdings WHERE user_id = ? AND stock_id = ?').get(userId, stockId) as any;
        if (!holding || holding.quantity < quantity) throw new Error('Insufficient quantity to sell');
        const proceeds = quantity * price;
        const brokerage = Math.max(20, proceeds * 0.0003);
        const netProceeds = proceeds - brokerage;
        db.prepare('UPDATE user_settings SET cash_balance = cash_balance + ? WHERE user_id = ?').run(netProceeds, userId);
        const newQty = holding.quantity - quantity;
        if (newQty > 0) {
            const totalOriginalCost = holding.quantity * holding.weighted_avg_buy_price;
            const soldSharesCost = quantity * holding.weighted_avg_buy_price;
            const newAvg = (totalOriginalCost - soldSharesCost) / newQty;
            db.prepare('UPDATE user_holdings SET quantity = ?, weighted_avg_buy_price = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newQty, newAvg, holding.id);
        } else {
            db.prepare('DELETE FROM user_holdings WHERE id = ?').run(holding.id);
        }
        db.prepare('INSERT INTO transactions (user_id, stock_id, type, quantity, price, brokerage_fee, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime(\'now\'))').run(userId, stockId, 'sell', quantity, price, brokerage);
    });
    tx();
    res.json({ data: true });
  } catch(err:any) { res.status(500).json({ error: err.message }); }
});

// --- OPTIONS ---

router.post('/options/fetch', (req: any, res) => {
  const userId = req.user.id;
  const { currentIndexValue } = req.body;
  try {
    const tx = db.transaction(() => {
      if (currentIndexValue !== null && currentIndexValue !== undefined) {
          const contracts = generateWeeklyOptionsContracts(currentIndexValue);
          for (const contract of contracts) {
              const exists = db.prepare('SELECT id FROM options_contracts WHERE strike_price = ? AND expiry_date = ? AND option_type = ?').get(contract.strikePrice, contract.expiryDate, contract.optionType);
              if (!exists) {
                  db.prepare('INSERT INTO options_contracts (strike_price, expiry_date, option_type, underlying_index_value_at_creation, created_at) VALUES (?, ?, ?, ?, ?)').run(contract.strikePrice, contract.expiryDate, contract.optionType, contract.underlyingIndexValueAtCreation, contract.createdAt);
              }
          }
      }
      
      const contracts = db.prepare('SELECT * FROM options_contracts').all();
      const holdings = db.prepare('SELECT * FROM user_options_holdings WHERE user_id = ?').all(userId);
      const transactions = db.prepare('SELECT * FROM option_transactions WHERE user_id = ? ORDER BY timestamp DESC').all(userId);
      const pnlHistory = db.prepare('SELECT * FROM option_pnl_history WHERE user_id = ? ORDER BY exit_date DESC').all(userId);
      return { contracts, holdings, transactions, pnlHistory };
    });
    const result = tx();
    res.json({ data: result });
  } catch(err:any) { res.status(500).json({ error: err.message }); }
});

router.post('/options/buy', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { contractId, quantity, premium, autoHedge, currentIndexValue } = req.body;
  try {
    const tx = db.transaction(() => {
      const contract = db.prepare('SELECT * FROM options_contracts WHERE id = ?').get(contractId) as any;
      if (!contract) throw new Error('Contract not found');
      
      const pType = contract.option_type === 'CE' ? 'long_ce' : 'long_pe';
      const hedgeInstructions = checkAndApplyHedge(userId, { contractId, type: pType, quantity, premium }, currentIndexValue, autoHedge);
      
      const totalPremium = premium * quantity;
      let totalReqCash = totalPremium;
      for (const h of hedgeInstructions.hedges) totalReqCash += h.reqCash;
      
      const cashRow = db.prepare('SELECT cash_balance FROM user_settings WHERE user_id = ?').get(userId) as any;
      if (cashRow.cash_balance < totalReqCash) throw new Error('Insufficient cash balance including hedges');
      db.prepare('UPDATE user_settings SET cash_balance = cash_balance - ? WHERE user_id = ?').run(totalReqCash, userId);
      
      const holding = db.prepare('SELECT * FROM user_options_holdings WHERE user_id = ? AND contract_id = ? AND type = ?').get(userId, contractId, pType) as any;
      if (holding) {
        const newQty = holding.quantity + quantity;
        const newAvg = ((holding.quantity * holding.weighted_avg_premium) + (quantity * premium)) / newQty;
        db.prepare('UPDATE user_options_holdings SET quantity = ?, weighted_avg_premium = ? WHERE id = ?').run(newQty, newAvg, holding.id);
      } else {
        db.prepare('INSERT INTO user_options_holdings (user_id, contract_id, quantity, type, weighted_avg_premium) VALUES (?, ?, ?, ?, ?)').run(userId, contractId, quantity, pType, premium);
      }
      db.prepare('INSERT INTO option_transactions (user_id, contract_id, type, quantity, premium_per_unit, total_premium) VALUES (?, ?, ?, ?, ?, ?)').run(userId, contractId, 'buy', quantity, premium, totalPremium);
      
      for (const h of hedgeInstructions.hedges) {
        const hHolding = db.prepare('SELECT * FROM user_options_holdings WHERE user_id = ? AND contract_id = ? AND type = ?').get(userId, h.contractId, h.type) as any;
        if (hHolding) {
          const newQty = hHolding.quantity + h.quantity;
          const newAvg = ((hHolding.quantity * hHolding.weighted_avg_premium) + (h.quantity * h.premium)) / newQty;
          db.prepare('UPDATE user_options_holdings SET quantity = ?, weighted_avg_premium = ? WHERE id = ?').run(newQty, newAvg, hHolding.id);
        } else {
          db.prepare('INSERT INTO user_options_holdings (user_id, contract_id, quantity, type, weighted_avg_premium) VALUES (?, ?, ?, ?, ?)').run(userId, h.contractId, h.quantity, h.type, h.premium);
        }
        db.prepare('INSERT INTO option_transactions (user_id, contract_id, type, quantity, premium_per_unit, total_premium) VALUES (?, ?, ?, ?, ?, ?)').run(userId, h.contractId, h.baseType, h.quantity, h.premium, h.premium * h.quantity);
      }
    });
    tx();
    res.json({ data: true });
  } catch(err:any) { res.status(500).json({ error: err.message }); }
});

router.post('/options/write', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { contractId, quantity, premium, autoHedge, currentIndexValue } = req.body;
  try {
    const tx = db.transaction(() => {
      const contract = db.prepare('SELECT * FROM options_contracts WHERE id = ?').get(contractId) as any;
      if (!contract) throw new Error('Contract not found');
      
      const pType = contract.option_type === 'CE' ? 'short_ce' : 'short_pe';
      const hedgeInstructions = checkAndApplyHedge(userId, { contractId, type: pType, quantity, premium }, currentIndexValue, autoHedge);
      
      const totalPremium = premium * quantity;
      const collateral = contract.strike_price * quantity;
      const mainReqCash = collateral - totalPremium;
      
      let totalReqCash = mainReqCash;
      for (const h of hedgeInstructions.hedges) totalReqCash += h.reqCash;
      
      const cashRow = db.prepare('SELECT cash_balance FROM user_settings WHERE user_id = ?').get(userId) as any;
      if (cashRow.cash_balance < totalReqCash) throw new Error('Insufficient cash for collateral and hedges');
      
      db.prepare('UPDATE user_settings SET cash_balance = cash_balance - ? WHERE user_id = ?').run(totalReqCash, userId);
      
      const holding = db.prepare('SELECT * FROM user_options_holdings WHERE user_id = ? AND contract_id = ? AND type = ?').get(userId, contractId, pType) as any;
      if (holding) {
        const newQty = holding.quantity + quantity;
        const newAvg = ((holding.quantity * holding.weighted_avg_premium) + (quantity * premium)) / newQty;
        db.prepare('UPDATE user_options_holdings SET quantity = ?, weighted_avg_premium = ? WHERE id = ?').run(newQty, newAvg, holding.id);
      } else {
        db.prepare('INSERT INTO user_options_holdings (user_id, contract_id, quantity, type, weighted_avg_premium) VALUES (?, ?, ?, ?, ?)').run(userId, contractId, quantity, pType, premium);
      }
      db.prepare('INSERT INTO option_transactions (user_id, contract_id, type, quantity, premium_per_unit, total_premium) VALUES (?, ?, ?, ?, ?, ?)').run(userId, contractId, 'write', quantity, premium, totalPremium);
      
      for (const h of hedgeInstructions.hedges) {
        const hHolding = db.prepare('SELECT * FROM user_options_holdings WHERE user_id = ? AND contract_id = ? AND type = ?').get(userId, h.contractId, h.type) as any;
        if (hHolding) {
          const newQty = hHolding.quantity + h.quantity;
          const newAvg = ((hHolding.quantity * hHolding.weighted_avg_premium) + (h.quantity * h.premium)) / newQty;
          db.prepare('UPDATE user_options_holdings SET quantity = ?, weighted_avg_premium = ? WHERE id = ?').run(newQty, newAvg, hHolding.id);
        } else {
          db.prepare('INSERT INTO user_options_holdings (user_id, contract_id, quantity, type, weighted_avg_premium) VALUES (?, ?, ?, ?, ?)').run(userId, h.contractId, h.quantity, h.type, h.premium);
        }
        db.prepare('INSERT INTO option_transactions (user_id, contract_id, type, quantity, premium_per_unit, total_premium) VALUES (?, ?, ?, ?, ?, ?)').run(userId, h.contractId, h.baseType, h.quantity, h.premium, h.premium * h.quantity);
      }
    });
    tx();
    res.json({ data: true });
  } catch(err:any) { res.status(500).json({ error: err.message }); }
});

router.post('/options/exit', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { holdingId, quantity, currentIndexValue } = req.body;
  try {
    const tx = db.transaction(() => {
      const holding = db.prepare('SELECT * FROM user_options_holdings WHERE id = ? AND user_id = ?').get(holdingId, userId) as any;
      if (!holding || holding.quantity < quantity) throw new Error('Invalid holding. Not enough quantity.');
      const contract = db.prepare('SELECT * FROM options_contracts WHERE id = ?').get(holding.contract_id) as any;
      
      const currentPremium = calculateOptionPrice(
        currentIndexValue || contract.underlying_index_value_at_creation,
        contract.strike_price,
        contract.expiry_date,
        contract.option_type,
        contract.created_at
      );

      if (holding.type === 'short_ce' || holding.type === 'short_pe') {
        const collateral = contract.strike_price * quantity;
        db.prepare('UPDATE user_settings SET cash_balance = cash_balance + ? WHERE user_id = ?').run(collateral, userId);
      } else {
        const proceeds = currentPremium * quantity;
        db.prepare('UPDATE user_settings SET cash_balance = cash_balance + ? WHERE user_id = ?').run(proceeds, userId);
      }

      if (holding.quantity > quantity) {
        db.prepare('UPDATE user_options_holdings SET quantity = ? WHERE id = ?').run(holding.quantity - quantity, holding.id);
      } else {
        db.prepare('DELETE FROM user_options_holdings WHERE id = ?').run(holding.id);
      }

      let exitPremium = 0, pnl = 0, pnlPercent = 0;
      if (holding.type === 'short_ce' || holding.type === 'short_pe') {
        exitPremium = holding.weighted_avg_premium;
        pnl = (exitPremium - currentPremium) * quantity;
        pnlPercent = exitPremium > 0 ? ((exitPremium - currentPremium) / exitPremium) * 100 : 0;
      } else {
        exitPremium = currentPremium;
        pnl = (exitPremium - holding.weighted_avg_premium) * quantity;
        pnlPercent = holding.weighted_avg_premium > 0 ? ((exitPremium - holding.weighted_avg_premium) / holding.weighted_avg_premium) * 100 : 0;
      }

      db.prepare('INSERT INTO option_pnl_history (user_id, contract_id, position_type, quantity, entry_premium, exit_premium, pnl, pnl_percent, exit_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(userId, contract.id, holding.type, quantity, holding.weighted_avg_premium, exitPremium, pnl, pnlPercent, 'manual');
      db.prepare('INSERT INTO option_transactions (user_id, contract_id, type, quantity, premium_per_unit, total_premium) VALUES (?, ?, ?, ?, ?, ?)').run(userId, contract.id, 'exit', quantity, holding.weighted_avg_premium, holding.weighted_avg_premium * quantity);
    });
    tx();
    res.json({ data: true });
  } catch(err:any) { res.status(500).json({ error: err.message }); }
});

router.post('/options/settle-expired', (req: any, res) => {
  const userId = req.user.id;
  try {
    const tx = db.transaction(() => {
        const nowStr = new Date().toISOString();
        const expiredContracts = db.prepare('SELECT * FROM options_contracts WHERE expiry_date < ?').all(nowStr) as any[];
        for (const contract of expiredContracts) {
            const holdings = db.prepare('SELECT * FROM user_options_holdings WHERE contract_id = ? AND user_id = ?').all(contract.id, userId) as any[];
            const indexRes = db.prepare('SELECT index_value FROM index_history WHERE date <= ? ORDER BY date DESC LIMIT 1').get(contract.expiry_date) as any;
            const expiryIndex = indexRes?.index_value ?? contract.underlying_index_value_at_creation;
            for (const holding of holdings) {
                let pnl = 0;
                if (holding.type === 'long_ce') { pnl = Math.max(0, expiryIndex - contract.strike_price) * holding.quantity; }
                else if (holding.type === 'short_ce') { pnl = -Math.max(0, expiryIndex - contract.strike_price) * holding.quantity + holding.weighted_avg_premium * holding.quantity + contract.strike_price * holding.quantity; }
                else if (holding.type === 'long_pe') { pnl = Math.max(0, contract.strike_price - expiryIndex) * holding.quantity; }
                else if (holding.type === 'short_pe') { pnl = -Math.max(0, contract.strike_price - expiryIndex) * holding.quantity + holding.weighted_avg_premium * holding.quantity + contract.strike_price * holding.quantity; }
                
                let pnlPercent = holding.weighted_avg_premium > 0 ? (pnl / (holding.weighted_avg_premium * holding.quantity)) * 100 : 0;
                db.prepare('INSERT INTO option_pnl_history (user_id, contract_id, position_type, quantity, entry_premium, exit_premium, pnl, pnl_percent, exit_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(userId, contract.id, holding.type, holding.quantity, holding.weighted_avg_premium, 0, pnl, pnlPercent, 'expiry');
                db.prepare('UPDATE user_settings SET cash_balance = cash_balance + ? WHERE user_id = ?').run(pnl, userId);
                db.prepare('DELETE FROM user_options_holdings WHERE id = ?').run(holding.id);
            }
        }
    });
    tx();
    res.json({ data: true });
  } catch(err:any) { res.status(500).json({ error: err.message }); }
});

router.post('/options/reset', (req: any, res) => {
  const userId = req.user.id;
  try {
    const tx = db.transaction(() => {
        db.prepare('DELETE FROM options_contracts').run(); // Assuming reset means empty the market for simplicity, or we scope to user. We'll just delete user's holdings.
        db.prepare('DELETE FROM user_options_holdings WHERE user_id = ?').run(userId);
        db.prepare('DELETE FROM option_transactions WHERE user_id = ?').run(userId);
    });
    tx();
    res.json({ data: true });
  } catch(err:any) { res.status(500).json({ error: err.message }); }
});

export default router;
