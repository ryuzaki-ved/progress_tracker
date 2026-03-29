import express, { type NextFunction, type Request, type Response } from 'express';
import db from './db.js';
import { authenticateToken } from './middleware.js';

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

export default router;
