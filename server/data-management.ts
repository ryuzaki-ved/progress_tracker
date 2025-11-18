import express from 'express';
import db from './db.js';
import { authenticateToken } from './middleware.js';

const router = express.Router();

router.get('/export', authenticateToken, (req: any, res) => {
  let userId = req.user.id;
  
  if (req.query.userId && req.user.role === 'admin') {
    userId = parseInt(req.query.userId as string);
  }
  
  try {
    const user = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(userId);
    const user_settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
    const stocks = db.prepare('SELECT * FROM stocks WHERE user_id = ?').all(userId);
    const index_history = db.prepare('SELECT * FROM index_history WHERE user_id = ?').all(userId);
    const user_holdings = db.prepare('SELECT * FROM user_holdings WHERE user_id = ?').all(userId);
    const transactions = db.prepare('SELECT * FROM transactions WHERE user_id = ?').all(userId);
    const notes = db.prepare('SELECT * FROM notes WHERE user_id = ?').all(userId);
    const option_transactions = db.prepare('SELECT * FROM option_transactions WHERE user_id = ?').all(userId);
    const user_options_holdings = db.prepare('SELECT * FROM user_options_holdings WHERE user_id = ?').all(userId);
    const option_pnl_history = db.prepare('SELECT * FROM option_pnl_history WHERE user_id = ?').all(userId);
    const journal_entries = db.prepare('SELECT * FROM journal_entries WHERE user_id = ?').all(userId);
    const streaks = db.prepare('SELECT * FROM streaks WHERE user_id = ?').all(userId);
    const weekly_reviews = db.prepare('SELECT * FROM weekly_reviews WHERE user_id = ?').all(userId);
    const reflection_insights = db.prepare('SELECT * FROM reflection_insights WHERE user_id = ?').all(userId);
    const alerts = db.prepare('SELECT * FROM alerts WHERE user_id = ?').all(userId);
    const achievements = db.prepare('SELECT * FROM achievements WHERE user_id = ?').all(userId);

    // Relational tables (Tasks and Performance link through Stocks)
    const tasks = db.prepare(`SELECT t.* FROM tasks t JOIN stocks s ON t.stock_id = s.id WHERE s.user_id = ?`).all(userId);
    const stock_performance_history = db.prepare(`SELECT p.* FROM stock_performance_history p JOIN stocks s ON p.stock_id = s.id WHERE s.user_id = ?`).all(userId);

    const exportData = {
      user,
      user_settings,
      stocks,
      tasks,
      stock_performance_history,
      index_history,
      user_holdings,
      transactions,
      notes,
      option_transactions,
      user_options_holdings,
      option_pnl_history,
      journal_entries,
      streaks,
      weekly_reviews,
      reflection_insights,
      alerts,
      achievements,
      exportedAt: new Date().toISOString()
    };

    res.json({ data: exportData, error: null });
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ data: null, error: error.message });
  }
});

router.post('/import', authenticateToken, express.json({ limit: '50mb' }), (req: any, res) => {
  const userId = req.user.id;
  const { data } = req.body;

  if (!data) {
    return res.status(400).json({ error: 'No payload provided' });
  }

  try {
    const runImportTransaction = db.transaction((importData) => {
      // 1. Delete all existing user data (Reverse dependency order to avoid constraints)
      db.prepare(`DELETE FROM tasks WHERE stock_id IN (SELECT id FROM stocks WHERE user_id = ?)`).run(userId);
      db.prepare(`DELETE FROM stock_performance_history WHERE stock_id IN (SELECT id FROM stocks WHERE user_id = ?)`).run(userId);
      db.prepare(`DELETE FROM user_holdings WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM transactions WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM option_transactions WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM user_options_holdings WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM option_pnl_history WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM index_history WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM notes WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM journal_entries WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM streaks WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM weekly_reviews WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM reflection_insights WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM alerts WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM achievements WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM stocks WHERE user_id = ?`).run(userId);
      db.prepare(`DELETE FROM user_settings WHERE user_id = ?`).run(userId);

      // Helper to dynamically build insert query
      const insertRows = (tableName: string, rows: any[]) => {
        if (!rows || rows.length === 0) return;
        const keys = Object.keys(rows[0]).filter(k => k !== 'id'); // usually we auto-increment, but for complete replication we might want to preserve IDs. Since SQLite relations rely on exact IDs, we MUST preserve IDs for relational tables like Stocks -> Tasks.
        const preserveKeys = Object.keys(rows[0]); 
        
        // Ensure user_id matches the importing user (prevent identity theft if importing someone else's file)
        const placeholders = preserveKeys.map(() => '?').join(', ');
        const columns = preserveKeys.join(', ');
        const statement = db.prepare(`INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`);
        
        for (const row of rows) {
          if (row.hasOwnProperty('user_id')) {
            row.user_id = userId; // Force current user ID
          }
          const values = preserveKeys.map(k => row[k]);
          statement.run(...values);
        }
      };

      // Ensure user_settings exists
      if (importData.user_settings) {
         importData.user_settings.user_id = userId;
         insertRows('user_settings', [importData.user_settings]);
      } else {
         db.prepare('INSERT INTO user_settings (user_id, cash_balance) VALUES (?, 10000000)').run(userId);
      }

      // 2. Insert new data in correct relational order
      insertRows('stocks', importData.stocks);
      
      // Stock dependents
      insertRows('tasks', importData.tasks);
      insertRows('stock_performance_history', importData.stock_performance_history);
      
      // Independent or direct user dependents
      insertRows('index_history', importData.index_history);
      insertRows('user_holdings', importData.user_holdings);
      insertRows('transactions', importData.transactions);
      insertRows('notes', importData.notes);
      insertRows('option_transactions', importData.option_transactions);
      insertRows('user_options_holdings', importData.user_options_holdings);
      insertRows('option_pnl_history', importData.option_pnl_history);
      insertRows('journal_entries', importData.journal_entries);
      insertRows('streaks', importData.streaks);
      insertRows('weekly_reviews', importData.weekly_reviews);
      insertRows('reflection_insights', importData.reflection_insights);
      insertRows('alerts', importData.alerts);
      insertRows('achievements', importData.achievements);
    });

    // Execute the transaction
    runImportTransaction(data);

    res.json({ data: 'Import successful', error: null });
  } catch (error: any) {
    console.error('Import transaction error:', error);
    res.status(500).json({ error: 'Failed to import data: ' + error.message });
  }
});

export default router;
