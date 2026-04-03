import express, { type NextFunction, type Request, type Response } from 'express';
import db from './db.js';
import { authenticateToken, isMaintenanceEnabled } from './middleware.js';

const router = express.Router();
router.use(authenticateToken);

type AuthedRequest = Request & { user?: { id: number } };

const getErrorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

// Middleware to check if user is admin
const isAdmin = (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

    const userRow = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role?: string } | undefined;
    if (!userRow || userRow.role !== 'admin') {
      return res.status(403).json({ error: 'Requires admin privileges' });
    }
    next();
  } catch {
    return res.status(500).json({ error: 'Internal error checking privileges' });
  }
};

router.get('/users/:id/details', isAdmin, (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ data: null, error: 'Invalid user id' });
    }

    const userRow = db
      .prepare(
        `
        SELECT
          u.id,
          u.username,
          u.role,
          u.show_in_leaderboard,
          us.cash_balance
        FROM users u
        LEFT JOIN user_settings us ON us.user_id = u.id
        WHERE u.id = ?
      `.trim()
      )
      .get(userId) as
        | {
            id: number;
            username: string;
            role: string;
            show_in_leaderboard: number;
            cash_balance: number | null;
          }
        | undefined;

    if (!userRow) {
      return res.status(404).json({ data: null, error: 'User not found' });
    }

    const stockCount =
      (db.prepare('SELECT COUNT(*) as c FROM stocks WHERE user_id = ?').get(userId) as { c?: number } | undefined)?.c ?? 0;
    const archivedStockCount =
      (db.prepare('SELECT COUNT(*) as c FROM stocks WHERE user_id = ? AND is_archived = 1').get(userId) as { c?: number } | undefined)?.c ??
      0;

    const taskCounts = db
      .prepare(
        `
        SELECT
          SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN t.status = 'overdue' THEN 1 ELSE 0 END) as overdue,
          SUM(CASE WHEN t.status = 'skipped' THEN 1 ELSE 0 END) as skipped,
          SUM(CASE WHEN t.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
          COUNT(*) as total
        FROM tasks t
        INNER JOIN stocks s ON s.id = t.stock_id
        WHERE s.user_id = ?
      `.trim()
      )
      .get(userId) as
        | {
            pending?: number;
            completed?: number;
            overdue?: number;
            skipped?: number;
            cancelled?: number;
            total?: number;
          }
        | undefined;

    const notesCount =
      (db.prepare('SELECT COUNT(*) as c FROM notes WHERE user_id = ?').get(userId) as { c?: number } | undefined)?.c ?? 0;
    const journalCount =
      (db.prepare('SELECT COUNT(*) as c FROM journal_entries WHERE user_id = ?').get(userId) as { c?: number } | undefined)?.c ?? 0;
    const reviewsCount =
      (db.prepare('SELECT COUNT(*) as c FROM weekly_reviews WHERE user_id = ?').get(userId) as { c?: number } | undefined)?.c ?? 0;
    const alertsUnreadCount =
      (db.prepare('SELECT COUNT(*) as c FROM alerts WHERE user_id = ? AND is_read = 0 AND is_dismissed = 0').get(userId) as { c?: number } | undefined)
        ?.c ?? 0;
    const achievementsUnlockedCount =
      (db.prepare('SELECT COUNT(*) as c FROM achievements WHERE user_id = ? AND is_unlocked = 1').get(userId) as { c?: number } | undefined)?.c ??
      0;
    const achievementsTotalCount =
      (db.prepare('SELECT COUNT(*) as c FROM achievements WHERE user_id = ?').get(userId) as { c?: number } | undefined)?.c ?? 0;

    const transactionsCount =
      (db.prepare('SELECT COUNT(*) as c FROM transactions WHERE user_id = ?').get(userId) as { c?: number } | undefined)?.c ?? 0;
    const optionTransactionsCount =
      (db.prepare('SELECT COUNT(*) as c FROM option_transactions WHERE user_id = ?').get(userId) as { c?: number } | undefined)?.c ?? 0;

    const holdingsCount =
      (db.prepare('SELECT COUNT(*) as c FROM user_holdings WHERE user_id = ?').get(userId) as { c?: number } | undefined)?.c ?? 0;
    const optionHoldingsCount =
      (db.prepare('SELECT COUNT(*) as c FROM user_options_holdings WHERE user_id = ?').get(userId) as { c?: number } | undefined)?.c ?? 0;

    const lastStockActivityAt =
      (db.prepare("SELECT MAX(COALESCE(last_activity_at, created_at)) as ts FROM stocks WHERE user_id = ?").get(userId) as { ts?: string | null } | undefined)
        ?.ts ?? null;
    const lastIndexUpdateAt =
      (db.prepare('SELECT MAX(created_at) as ts FROM index_history WHERE user_id = ?').get(userId) as { ts?: string | null } | undefined)?.ts ??
      null;
    const lastNoteUpdateAt =
      (db.prepare('SELECT MAX(updated_at) as ts FROM notes WHERE user_id = ?').get(userId) as { ts?: string | null } | undefined)?.ts ?? null;
    const lastJournalUpdateAt =
      (db.prepare('SELECT MAX(updated_at) as ts FROM journal_entries WHERE user_id = ?').get(userId) as { ts?: string | null } | undefined)?.ts ??
      null;

    const topStocks = db
      .prepare(
        `
        SELECT id, name, category, current_score, created_at, last_activity_at, is_archived
        FROM stocks
        WHERE user_id = ?
        ORDER BY is_archived ASC, current_score DESC, id DESC
        LIMIT 12
      `.trim()
      )
      .all(userId);

    const recentTasks = db
      .prepare(
        `
        SELECT
          t.id,
          t.title,
          t.status,
          t.priority,
          t.points,
          t.due_date,
          t.completed_at,
          t.created_at,
          s.name as stock_name
        FROM tasks t
        INNER JOIN stocks s ON s.id = t.stock_id
        WHERE s.user_id = ?
        ORDER BY COALESCE(t.updated_at, t.created_at) DESC
        LIMIT 12
      `.trim()
      )
      .all(userId);

    const recentNotes = db
      .prepare(
        `
        SELECT id, title, category, is_pinned, is_archived, created_at, updated_at
        FROM notes
        WHERE user_id = ?
        ORDER BY is_pinned DESC, updated_at DESC
        LIMIT 8
      `.trim()
      )
      .all(userId);

    const recentTransactions = db
      .prepare(
        `
        SELECT
          tx.id,
          tx.type,
          tx.quantity,
          tx.price,
          tx.brokerage_fee,
          tx.timestamp,
          s.name as stock_name
        FROM transactions tx
        INNER JOIN stocks s ON s.id = tx.stock_id
        WHERE tx.user_id = ?
        ORDER BY tx.timestamp DESC
        LIMIT 12
      `.trim()
      )
      .all(userId);

    const latestIndexRow = db
      .prepare(
        `
        SELECT date, open, high, low, close, daily_change, change_percent, commentary, created_at
        FROM index_history
        WHERE user_id = ?
        ORDER BY date DESC
        LIMIT 1
      `.trim()
      )
      .get(userId);

    const streaks = db
      .prepare(
        `
        SELECT type, current_streak, longest_streak, last_activity_date, is_active, updated_at
        FROM streaks
        WHERE user_id = ?
        ORDER BY is_active DESC, updated_at DESC
      `.trim()
      )
      .all(userId);

    const recentAlerts = db
      .prepare(
        `
        SELECT id, type, title, message, severity, is_read, is_dismissed, created_at
        FROM alerts
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `.trim()
      )
      .all(userId);

    res.json({
      data: {
        user: userRow,
        stats: {
          stockCount,
          archivedStockCount,
          holdingsCount,
          optionHoldingsCount,
          taskCounts: {
            pending: Number(taskCounts?.pending ?? 0),
            completed: Number(taskCounts?.completed ?? 0),
            overdue: Number(taskCounts?.overdue ?? 0),
            skipped: Number(taskCounts?.skipped ?? 0),
            cancelled: Number(taskCounts?.cancelled ?? 0),
            total: Number(taskCounts?.total ?? 0),
          },
          notesCount,
          journalCount,
          reviewsCount,
          alertsUnreadCount,
          achievementsUnlockedCount,
          achievementsTotalCount,
          transactionsCount,
          optionTransactionsCount,
        },
        activity: {
          lastStockActivityAt,
          lastIndexUpdateAt,
          lastNoteUpdateAt,
          lastJournalUpdateAt,
        },
        lists: {
          topStocks,
          recentTasks,
          recentNotes,
          recentTransactions,
          latestIndexRow: latestIndexRow ?? null,
          streaks,
          recentAlerts,
        },
      },
      error: null,
    });
  } catch (err: unknown) {
    res.status(500).json({ data: null, error: getErrorMessage(err) });
  }
});

router.get('/users', isAdmin, (req: Request, res: Response) => {
  try {
    const users = db.prepare('SELECT id, username, role, show_in_leaderboard FROM users ORDER BY id ASC').all();
    res.json({ data: users, error: null });
  } catch (err: unknown) {
    res.status(500).json({ data: null, error: getErrorMessage(err) });
  }
});

router.put('/users/:id/leaderboard', isAdmin, (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const { show_in_leaderboard } = req.body as { show_in_leaderboard?: boolean };
    db.prepare('UPDATE users SET show_in_leaderboard = ? WHERE id = ?').run(show_in_leaderboard ? 1 : 0, userId);
    res.json({ data: true, error: null });
  } catch (err: unknown) {
    res.status(500).json({ data: null, error: getErrorMessage(err) });
  }
});

router.delete('/users/:id', isAdmin, (req: Request, res: Response) => {
  const userId = req.params.id;
  try {
    db.transaction(() => {
      // Delete user data sequentially according to schema
      db.prepare('DELETE FROM stock_performance_history WHERE stock_id IN (SELECT id FROM stocks WHERE user_id = ?)').run(userId);
      db.prepare('DELETE FROM tasks WHERE stock_id IN (SELECT id FROM stocks WHERE user_id = ?)').run(userId);
      db.prepare('DELETE FROM user_holdings WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM index_history WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM notes WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM journal_entries WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM streaks WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM weekly_reviews WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM reflection_insights WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM alerts WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM achievements WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM user_options_holdings WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM option_transactions WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM option_pnl_history WHERE user_id = ?').run(userId);
      
      // Delete stocks only after dependents are cleared
      db.prepare('DELETE FROM stocks WHERE user_id = ?').run(userId);
      
      // Finally delete the user and settings
      db.prepare('DELETE FROM user_settings WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    })();
    res.json({ data: true, error: null });
  } catch (err: unknown) {
    res.status(500).json({ data: null, error: getErrorMessage(err) });
  }
});

// --- MAINTENANCE MODE ENDPOINTS ---

// Get maintenance status
router.get('/maintenance/status', isAdmin, (req: Request, res: Response) => {
  try {
    const maintenanceMode = isMaintenanceEnabled();
    res.json({ data: { isEnabled: maintenanceMode }, error: null });
  } catch (err: unknown) {
    res.status(500).json({ data: null, error: getErrorMessage(err) });
  }
});

// Enable maintenance mode
router.post('/maintenance/enable', isAdmin, (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const maintenanceMessage = message || 'The system is under maintenance. We will be back shortly.';
    
    // Enable maintenance mode
    db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run('maintenance_mode', 'true');
    
    // Create maintenance alert for all non-admin users
    try {
      const users = db.prepare('SELECT id FROM users WHERE role != ?').all('admin') as { id: number }[];
      users.forEach((user: any) => {
        try {
          db.prepare(`
            INSERT INTO alerts (user_id, type, title, message, severity)
            VALUES (?, ?, ?, ?, ?)
          `).run(user.id, 'maintenance', 'System Maintenance', maintenanceMessage, 'high');
        } catch (alertErr) {
          console.error('Alert insert error for user:', user.id, alertErr);
        }
      });
    } catch (usersErr) {
      console.error('Users query error:', usersErr);
    }

    res.json({ data: true, error: null });
  } catch (err: unknown) {
    console.error('Maintenance enable error:', err);
    res.status(500).json({ data: null, error: getErrorMessage(err) });
  }
});

// Disable maintenance mode
router.post('/maintenance/disable', isAdmin, (req: Request, res: Response) => {
  try {
    // Disable maintenance mode
    db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run('maintenance_mode', 'false');
    
    // Create alert to all non-admin users that system is back
    try {
      const users = db.prepare('SELECT id FROM users WHERE role != ?').all('admin') as { id: number }[];
      users.forEach((user: any) => {
        try {
          db.prepare(`
            INSERT INTO alerts (user_id, type, title, message, severity)
            VALUES (?, ?, ?, ?, ?)
          `).run(user.id, 'maintenance_end', 'System Back Online', 'The system is now back to normal. Thank you for your patience!', 'medium');
        } catch (alertErr) {
          console.error('Alert insert error for user:', user.id, alertErr);
        }
      });
    } catch (usersErr) {
      console.error('Users query error:', usersErr);
    }

    res.json({ data: true, error: null });
  } catch (err: unknown) {
    console.error('Maintenance disable error:', err);
    res.status(500).json({ data: null, error: getErrorMessage(err) });
  }
});

// Get all bonds statistics for admin
router.get('/bonds/statistics', isAdmin, (req: Request, res: Response) => {
  try {
    const bonds = db.prepare('SELECT * FROM performance_bonds').all() as any[];
    
    // Calculate deposited pool (money from bonds where both failed/completed late = winner = 'none')
    const depositedBonds = bonds.filter(b => b.status === 'completed' && b.winner === 'none');
    const totalDeposited = depositedBonds.reduce((sum, b) => sum + (b.creator_amount || 0) + (b.challenger_amount || 0), 0);
    
    // Get stored deposited amount from system_settings
    const depositedSetting = db.prepare('SELECT value FROM system_settings WHERE "key" = ?').get('bonds_deposited_pool') as any;
    const storedDeposited = depositedSetting ? parseInt(depositedSetting.value || '0') : 0;
    
    // Calculate statistics
    const stats = {
      totalBonds: bonds.length,
      pendingBonds: bonds.filter(b => b.status === 'pending_acceptance').length,
      activeBonds: bonds.filter(b => b.status === 'active').length,
      completedBonds: bonds.filter(b => b.status === 'completed').length,
      bothWon: bonds.filter(b => b.status === 'completed' && b.winner === 'both').length,
      bothFailed: bonds.filter(b => b.status === 'completed' && b.winner === 'none').length,
      creatorWon: bonds.filter(b => b.status === 'completed' && b.winner === 'creator').length,
      challengerWon: bonds.filter(b => b.status === 'completed' && b.winner === 'challenger').length,
      calculatedDeposited: totalDeposited,
      storedDeposited: storedDeposited,
      totalMoneyInBonds: bonds.reduce((sum, b) => sum + (b.creator_amount || 0) + (b.challenger_amount || 0), 0),
    };

    res.json({ data: stats, error: null });
  } catch (err: unknown) {
    console.error('Bonds stats error:', err);
    res.status(500).json({ data: null, error: getErrorMessage(err) });
  }
});

// Get all bonds with user info for admin
router.get('/bonds/all', isAdmin, (req: Request, res: Response) => {
  try {
    const bonds = db.prepare(`
      SELECT 
        b.*,
        cu.username as creator_username,
        ch.username as challenger_username
      FROM performance_bonds b
      LEFT JOIN users cu ON b.creator_id = cu.id
      LEFT JOIN users ch ON b.challenger_id = ch.id
      ORDER BY b.created_at DESC
    `).all() as any[];

    res.json({ data: bonds, error: null });
  } catch (err: unknown) {
    console.error('Bonds fetch error:', err);
    res.status(500).json({ data: null, error: getErrorMessage(err) });
  }
});

// Delete a bond (admin only)
router.delete('/bonds/:id', isAdmin, (req: Request, res: Response) => {
  try {
    const bondId = req.params.id;
    const result = db.prepare('DELETE FROM performance_bonds WHERE id = ?').run(bondId);
    
    if ((result as any).changes === 0) {
      return res.status(404).json({ data: null, error: 'Bond not found' });
    }
    
    console.log('Bond deleted:', bondId);
    res.json({ data: true, error: null });
  } catch (err: unknown) {
    console.error('Bond delete error:', err);
    res.status(500).json({ data: null, error: getErrorMessage(err) });
  }
});

// Update deposited pool
router.post('/bonds/deposited-pool/update', isAdmin, (req: AuthedRequest, res: Response) => {
  try {
    const { amount } = req.body;
    
    if (typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    db.prepare('INSERT OR REPLACE INTO system_settings ("key", value) VALUES (?, ?)').run('bonds_deposited_pool', amount.toString());

    res.json({ data: { depositedPool: amount }, error: null });
  } catch (err: unknown) {
    console.error('Deposited pool update error:', err);
    res.status(500).json({ data: null, error: getErrorMessage(err) });
  }
});

// Reset deposited pool to zero
router.post('/bonds/deposited-pool/reset', isAdmin, (req: Request, res: Response) => {
  try {
    db
      .prepare(
        `
          INSERT INTO system_settings ("key", value, updated_at)
          VALUES (?, ?, datetime('now'))
          ON CONFLICT("key") DO UPDATE SET
            value = excluded.value,
            updated_at = datetime('now')
        `.trim()
      )
      .run('bonds_deposited_pool', '0');

    const verify1 = db.prepare('SELECT value FROM system_settings WHERE "key" = ?').get('bonds_deposited_pool') as any;
    const finalValue = verify1 ? parseInt(verify1.value || '0') : 0;

    res.json({ data: { depositedPool: finalValue, message: 'Pool reset successfully' }, error: null });
  } catch (err: unknown) {
    console.error('Deposited pool reset error:', err);
    res.status(500).json({ data: null, error: getErrorMessage(err) });
  }
});

// Get maintenance mode status (admin only)
router.get('/maintenance', isAdmin, (req: Request, res: Response) => {
  try {
    const setting = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('maintenance_mode') as any;
    const maintenanceMode = setting ? setting.value === '1' : false;
    
    console.log('Fetched maintenance mode:', maintenanceMode);
    res.json({ data: { maintenanceMode }, error: null });
  } catch (err: unknown) {
    console.error('Maintenance mode fetch error:', err);
    res.status(500).json({ data: null, error: getErrorMessage(err) });
  }
});

// Toggle maintenance mode (admin only)
router.post('/maintenance', isAdmin, (req: Request, res: Response) => {
  try {
    const { maintenanceMode } = req.body;
    
    if (typeof maintenanceMode !== 'boolean') {
      return res.status(400).json({ error: 'maintenanceMode must be a boolean' });
    }
    
    const value = maintenanceMode ? '1' : '0';
    db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run('maintenance_mode', value);
    
    console.log('Maintenance mode set to:', maintenanceMode);
    res.json({ data: { maintenanceMode }, error: null });
  } catch (err: unknown) {
    console.error('Maintenance mode toggle error:', err);
    res.status(500).json({ data: null, error: getErrorMessage(err) });
  }
});

export default router;
