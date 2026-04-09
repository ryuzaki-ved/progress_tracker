import express from 'express';
import db from './db.js';
import { authenticateToken, checkMaintenanceMode } from './middleware.js';

const router = express.Router();

function withDivisorAdjustment(userId: number, action: () => any) {
  return db.transaction(() => {
    const stocksOld = db.prepare('SELECT current_score, weight FROM stocks WHERE user_id = ?').all(userId) as any[];
    const oldSum = stocksOld.reduce((sum, s) => sum + ((s.current_score ?? 500) * Number(s.weight)), 0);
    const oldSettings = db.prepare('SELECT index_divisor FROM user_settings WHERE user_id = ?').get(userId) as any;
    const oldDivisor = oldSettings?.index_divisor ?? 1.0;
    const oldIndex = oldDivisor > 0 ? (oldSum / oldDivisor) : oldSum;

    const result = action();

    const stocksNew = db.prepare('SELECT current_score, weight FROM stocks WHERE user_id = ?').all(userId) as any[];
    const newSum = stocksNew.reduce((sum, s) => sum + ((s.current_score ?? 500) * Number(s.weight)), 0);
    
    let newDivisor = 1.0;
    if (oldIndex > 0) {
      newDivisor = newSum / oldIndex;
    } else if (newSum > 0) {
      newDivisor = newSum / 500.0;
    }
    
    if (!oldSettings) {
        db.prepare('INSERT INTO user_settings (user_id, index_divisor, cash_balance) VALUES (?, ?, 10000000)').run(userId, newDivisor);
    } else {
        db.prepare('UPDATE user_settings SET index_divisor = ? WHERE user_id = ?').run(newDivisor, userId);
    }
    return result;
  })();
}

router.use(authenticateToken);

router.get('/history', (req: any, res) => {
  const userId = req.user.id;
  try {
    const histRows = db.prepare(`
      SELECT stock_performance_history.* 
      FROM stock_performance_history
      JOIN stocks ON stock_performance_history.stock_id = stocks.id
      WHERE stocks.user_id = ?
      ORDER BY date DESC
    `).all(userId);
    res.json({ data: histRows, error: null });
  } catch(err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.get('/', (req: any, res) => {
  const userId = req.user.id;
  try {
    const settings = db.prepare('SELECT index_divisor FROM user_settings WHERE user_id = ?').get(userId) as any;
    const indexDivisor = settings?.index_divisor ?? 1.0;
    
    const stocks = db.prepare('SELECT * FROM stocks WHERE user_id = ? ORDER BY created_at').all(userId) as any[];
    
    const stocksList = stocks.map(stockObj => {
      const perfRow = db.prepare('SELECT score_delta, delta_percent FROM stock_performance_history WHERE stock_id = ? ORDER BY date DESC LIMIT 1').get(stockObj.id) as any;
      const change = perfRow ? perfRow.score_delta : 0;
      const changePercent = perfRow ? perfRow.delta_percent : 0;
      
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      
      const histRows = db.prepare('SELECT date, daily_score, score_delta FROM stock_performance_history WHERE stock_id = ? AND date >= ? ORDER BY date ASC').all(stockObj.id, startDate.toISOString().slice(0, 10)) as any[];
      
      const history = histRows.map(h => ({ date: h.date, value: h.daily_score }));
      const scoreDeltas = histRows.map(h => h.score_delta);
      
      let volatility = 'low';
      if (scoreDeltas.length >= 5) {
        const mean = scoreDeltas.reduce((a, b) => a + b, 0) / scoreDeltas.length;
        const variance = scoreDeltas.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scoreDeltas.length;
        const stdDev = Math.sqrt(variance);
        if (stdDev < 10) volatility = 'low';
        else if (stdDev < 30) volatility = 'medium';
        else volatility = 'high';
      } else if (scoreDeltas.length > 0) {
        const maxAbsDelta = Math.max(...scoreDeltas.map(d => Math.abs(d)));
        if (maxAbsDelta < 10) volatility = 'low';
        else if (maxAbsDelta < 30) volatility = 'medium';
        else volatility = 'high';
      }
      
      return {
        id: stockObj.id.toString(),
        name: stockObj.name,
        icon: stockObj.icon || 'activity',
        category: stockObj.category || 'General',
        currentScore: stockObj.current_score ?? 500,
        change,
        changePercent,
        volatility,
        lastActivity: stockObj.last_activity_at ? stockObj.last_activity_at : new Date().toISOString(),
        color: stockObj.color,
        weight: Number(stockObj.weight),
        isArchived: Boolean(stockObj.is_archived),
        history,
      };
    });
    res.json({ data: stocksList, meta: { indexDivisor }, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.post('/', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { name, description, category, color, weight, icon } = req.body;
  try {
    const info = withDivisorAdjustment(userId, () => {
      return db.prepare('INSERT INTO stocks (user_id, name, description, category, color, weight, icon) VALUES (?, ?, ?, ?, ?, ?, ?)').run(userId, name, description || null, category || null, color, weight, icon || null);
    });
    res.json({ data: { id: info.lastInsertRowid }, error: null });
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ data: null, error: 'A stock with this name already exists.' });
    } else {
      res.status(500).json({ data: null, error: err.message });
    }
  }
});

router.put('/:id', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const updates = req.body;
  
  if (updates.current_score !== undefined && updates.last_activity_at !== undefined) {
      try {
          db.prepare('UPDATE stocks SET current_score = ?, last_activity_at = ? WHERE id = ? AND user_id = ?').run(updates.current_score, updates.last_activity_at, id, userId);
          res.json({ data: true, error: null });
      } catch (err:any) { res.status(500).json({ error: err.message }) }
      return;
  }

  if (updates.is_archived !== undefined) {
      try {
          db.prepare('UPDATE stocks SET is_archived = ? WHERE id = ? AND user_id = ?').run(updates.is_archived ? 1 : 0, id, userId);
          res.json({ data: true, error: null });
      } catch (err:any) { res.status(500).json({ error: err.message }) }
      return;
  }

  try {
    withDivisorAdjustment(userId, () => {
      db.prepare('UPDATE stocks SET name = ?, category = ?, color = ?, weight = ?, icon = ? WHERE id = ? AND user_id = ?').run(updates.name, updates.category, updates.color, updates.weight, updates.icon, id, userId);
    });
    res.json({ data: true, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

router.delete('/:id', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const stock = db.prepare('SELECT id FROM stocks WHERE id = ? AND user_id = ?').get(id, userId);
    if (!stock) {
      return res.status(404).json({ data: null, error: 'Stock not found or unauthorized' });
    }

    withDivisorAdjustment(userId, () => {
      // Cascade delete dependent records
      db.prepare('DELETE FROM tasks WHERE stock_id = ?').run(id);
      db.prepare('DELETE FROM stock_performance_history WHERE stock_id = ?').run(id);
      db.prepare('DELETE FROM user_holdings WHERE stock_id = ?').run(id);
      db.prepare('DELETE FROM transactions WHERE stock_id = ?').run(id);
      db.prepare('DELETE FROM alerts WHERE stock_id = ?').run(id.toString());
      
      // Delete parent stock
      db.prepare('DELETE FROM stocks WHERE id = ? AND user_id = ?').run(id, userId);
    });
    
    res.json({ data: true, error: null });
  } catch(err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

export default router;
