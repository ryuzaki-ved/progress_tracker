import express from 'express';
import db from './db.js';
import { authenticateToken, checkMaintenanceMode } from './middleware.js';

const router = express.Router();

router.use(authenticateToken);

// Get all bonds for a user
router.get('/', (req: any, res) => {
  const userId = req.user.id;
  try {
    const bonds = db.prepare(`
      SELECT 
        b.*,
        cu.username as creator_username,
        ch.username as challenger_username
      FROM performance_bonds b
      LEFT JOIN users cu ON b.creator_id = cu.id
      LEFT JOIN users ch ON b.challenger_id = ch.id
      WHERE b.creator_id = ? OR b.challenger_id = ?
      ORDER BY b.created_at DESC
    `).all(userId, userId) as any[];

    res.json({ data: bonds, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

// Create a new bond challenge
router.post('/create', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { challengerId, creatorAmount, challengerAmount, dueDate, creatorTaskId } = req.body;

  if (!challengerId || !creatorAmount || !challengerAmount || !dueDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const info = db.prepare(`
      INSERT INTO performance_bonds 
      (creator_id, challenger_id, creator_task_id, creator_amount, challenger_amount, due_date, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(userId, challengerId, creatorTaskId, creatorAmount, challengerAmount, dueDate);

    res.json({ data: { bondId: info.lastInsertRowid }, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

// Accept a bond challenge
router.post('/:id/accept', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { challengerTaskId } = req.body;

  try {
    const bond = db.prepare('SELECT * FROM performance_bonds WHERE id = ?').get(id) as any;
    if (!bond) return res.status(404).json({ error: 'Bond not found' });
    if (bond.challenger_id !== userId) return res.status(403).json({ error: 'Unauthorized' });

    db.prepare('UPDATE performance_bonds SET status = ?, challenger_task_id = ? WHERE id = ?').run('active', challengerTaskId, id);
    res.json({ data: true, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

// Complete a bond
router.post('/:id/complete', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const bond = db.prepare('SELECT * FROM performance_bonds WHERE id = ?').get(id) as any;
    if (!bond) return res.status(404).json({ error: 'Bond not found' });

    const isCreator = bond.creator_id === userId;
    const isChallenger = bond.challenger_id === userId;

    if (!isCreator && !isChallenger) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Update completion flag
    if (isCreator) {
      db.prepare('UPDATE performance_bonds SET creator_completed = 1 WHERE id = ?').run(id);
    } else {
      db.prepare('UPDATE performance_bonds SET challenger_completed = 1 WHERE id = ?').run(id);
    }

    // Check if both have completed
    const updatedBond = db.prepare('SELECT * FROM performance_bonds WHERE id = ?').get(id) as any;
    
    if (updatedBond.creator_completed && updatedBond.challenger_completed) {
      // Both completed - determine winner
      const now = new Date();
      const dueDate = new Date(updatedBond.due_date);
      const isLate = now > dueDate;

      console.log('Bond completion check:', { bondId: id, now: now.toISOString(), dueDate: dueDate.toISOString(), isLate });

      if (isLate) {
        // Both completed late - forfeit
        db.prepare('UPDATE performance_bonds SET status = ?, winner = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run('completed', 'none', id);
        
        // Add to deposited pool
        const depositedBonds = db.prepare('SELECT SUM(creator_amount + challenger_amount) as total FROM performance_bonds WHERE status = ? AND winner = ?').get('completed', 'none') as any;
        const depositedTotal = depositedBonds?.total || 0;
        db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run('bonds_deposited_pool', depositedTotal.toString());
      } else {
        // On time - both win and money returned
        db.prepare('UPDATE performance_bonds SET status = ?, winner = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run('completed', 'both', id);
      }
    }

    res.json({ data: true, error: null });
  } catch (err: any) {
    console.error('Bond completion error:', err);
    res.status(500).json({ data: null, error: err.message });
  }
});

// Forfeit a bond
router.post('/:id/forfeit', checkMaintenanceMode, (req: any, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    const bond = db.prepare('SELECT * FROM performance_bonds WHERE id = ?').get(id) as any;
    if (!bond) return res.status(404).json({ error: 'Bond not found' });

    const isCreator = bond.creator_id === userId;
    const isChallenger = bond.challenger_id === userId;

    if (!isCreator && !isChallenger) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Mark as completed with winner being the other user
    const winner = isCreator ? 'challenger' : 'creator';
    db.prepare('UPDATE performance_bonds SET status = ?, winner = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?').run('completed', winner, id);

    res.json({ data: true, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

// Get available users to challenge
router.get('/available-users', (req: any, res) => {
  const userId = req.user.id;
  try {
    const users = db.prepare('SELECT id, username FROM users WHERE id != ? ORDER BY username').all(userId) as any[];
    res.json({ data: users, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: err.message });
  }
});

export default router;
