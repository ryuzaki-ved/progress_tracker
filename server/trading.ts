import express from 'express';
import db from './db.js';
import { authenticateToken } from './middleware.js';
import { generateWeeklyOptionsContracts, calculateOptionPrice } from '../src/utils/optionUtils.js';

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

router.post('/add-funds', (req: any, res) => {
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

router.post('/buy-stock', (req: any, res) => {
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
        db.prepare('UPDATE user_holdings SET quantity = ?, weighted_avg_buy_price = ?, updated_at = datetime("now") WHERE id = ?').run(newQty, newAvg, holding.id);
      } else {
        db.prepare('INSERT INTO user_holdings (user_id, stock_id, quantity, weighted_avg_buy_price, created_at) VALUES (?, ?, ?, ?, datetime("now"))').run(userId, stockId, quantity, price);
      }
      db.prepare('INSERT INTO transactions (user_id, stock_id, type, quantity, price, brokerage_fee, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))').run(userId, stockId, 'buy', quantity, price, Math.max(20, (quantity * price) * 0.0003));
    });
    tx();
    res.json({ data: true });
  } catch(err:any) { res.status(500).json({ error: err.message }); }
});

router.post('/sell-stock', (req: any, res) => {
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
            db.prepare('UPDATE user_holdings SET quantity = ?, weighted_avg_buy_price = ?, updated_at = datetime("now") WHERE id = ?').run(newQty, newAvg, holding.id);
        } else {
            db.prepare('DELETE FROM user_holdings WHERE id = ?').run(holding.id);
        }
        db.prepare('INSERT INTO transactions (user_id, stock_id, type, quantity, price, brokerage_fee, timestamp) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))').run(userId, stockId, 'sell', quantity, price, brokerage);
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

router.post('/options/buy', (req: any, res) => {
  const userId = req.user.id;
  const { contractId, quantity, premium } = req.body;
  try {
    const tx = db.transaction(() => {
      const contract = db.prepare('SELECT * FROM options_contracts WHERE id = ?').get(contractId) as any;
      if (!contract) throw new Error('Contract not found');
      const totalPremium = premium * quantity;
      const cashRow = db.prepare('SELECT cash_balance FROM user_settings WHERE user_id = ?').get(userId) as any;
      if (cashRow.cash_balance < totalPremium) throw new Error('Insufficient cash balance');
      db.prepare('UPDATE user_settings SET cash_balance = cash_balance - ? WHERE user_id = ?').run(totalPremium, userId);
      
      const pType = contract.option_type === 'CE' ? 'long_ce' : 'long_pe';
      const holding = db.prepare('SELECT * FROM user_options_holdings WHERE user_id = ? AND contract_id = ? AND type = ?').get(userId, contractId, pType) as any;
      if (holding) {
        const newQty = holding.quantity + quantity;
        const newAvg = ((holding.quantity * holding.weighted_avg_premium) + (quantity * premium)) / newQty;
        db.prepare('UPDATE user_options_holdings SET quantity = ?, weighted_avg_premium = ? WHERE id = ?').run(newQty, newAvg, holding.id);
      } else {
        db.prepare('INSERT INTO user_options_holdings (user_id, contract_id, quantity, type, weighted_avg_premium) VALUES (?, ?, ?, ?, ?)').run(userId, contractId, quantity, pType, premium);
      }
      db.prepare('INSERT INTO option_transactions (user_id, contract_id, type, quantity, premium_per_unit, total_premium) VALUES (?, ?, ?, ?, ?, ?)').run(userId, contractId, 'buy', quantity, premium, totalPremium);
    });
    tx();
    res.json({ data: true });
  } catch(err:any) { res.status(500).json({ error: err.message }); }
});

router.post('/options/write', (req: any, res) => {
  const userId = req.user.id;
  const { contractId, quantity, premium } = req.body;
  try {
    const tx = db.transaction(() => {
      const contract = db.prepare('SELECT * FROM options_contracts WHERE id = ?').get(contractId) as any;
      if (!contract) throw new Error('Contract not found');
      const totalPremium = premium * quantity;
      const collateral = contract.strike_price * quantity;
      const cashRow = db.prepare('SELECT cash_balance FROM user_settings WHERE user_id = ?').get(userId) as any;
      if (cashRow.cash_balance < collateral) throw new Error('Insufficient cash for collateral');
      db.prepare('UPDATE user_settings SET cash_balance = cash_balance - ? + ? WHERE user_id = ?').run(collateral, totalPremium, userId);
      
      const pType = contract.option_type === 'CE' ? 'short_ce' : 'short_pe';
      const holding = db.prepare('SELECT * FROM user_options_holdings WHERE user_id = ? AND contract_id = ? AND type = ?').get(userId, contractId, pType) as any;
      if (holding) {
        const newQty = holding.quantity + quantity;
        const newAvg = ((holding.quantity * holding.weighted_avg_premium) + (quantity * premium)) / newQty;
        db.prepare('UPDATE user_options_holdings SET quantity = ?, weighted_avg_premium = ? WHERE id = ?').run(newQty, newAvg, holding.id);
      } else {
        db.prepare('INSERT INTO user_options_holdings (user_id, contract_id, quantity, type, weighted_avg_premium) VALUES (?, ?, ?, ?, ?)').run(userId, contractId, quantity, pType, premium);
      }
      db.prepare('INSERT INTO option_transactions (user_id, contract_id, type, quantity, premium_per_unit, total_premium) VALUES (?, ?, ?, ?, ?, ?)').run(userId, contractId, 'write', quantity, premium, totalPremium);
    });
    tx();
    res.json({ data: true });
  } catch(err:any) { res.status(500).json({ error: err.message }); }
});

router.post('/options/exit', (req: any, res) => {
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
