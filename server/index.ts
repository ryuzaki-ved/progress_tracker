import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import db from './db.js';

import stocksRouter from './stocks.js';
import tasksRouter from './tasks.js';
import indexDataRouter from './index-data.js';
import notesRouter from './notes.js';
import journalRouter from './journal.js';
import streaksRouter from './streaks.js';
import alertsRouter from './alerts.js';
import reviewsRouter from './reviews.js';
import achievementsRouter from './achievements.js';
import tradingRouter from './trading.js';
import adminRouter from './admin.js';
import leaderboardRouter from './leaderboard.js';
import dataManagementRouter from './data-management.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'super_secret_progress_tracker_key_44321'; // For personal use

app.use(cors());
app.use(express.json());

// Middleware moved to middleware.ts

console.log('stocksRouter is:', typeof stocksRouter, stocksRouter === undefined ? 'undefined' : Object.keys(stocksRouter));
app.use('/api/stocks', stocksRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/index', indexDataRouter);
app.use('/api/notes', notesRouter);
app.use('/api/journal', journalRouter);
app.use('/api/streaks', streaksRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/achievements', achievementsRouter);
app.use('/api/trading', tradingRouter);
app.use('/api/admin', adminRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/data', dataManagementRouter);

// --- AUTHENTICATION ---
app.post('/api/auth/signin', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const user = db.prepare('SELECT id, username, role FROM users WHERE username = ? AND password = ?').get(username, password) as any;
  if (user) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
    res.json({ data: { user, token }, error: null });
  } else {
    res.status(401).json({ data: null, error: 'Invalid username or password' });
  }
});

app.post('/api/auth/signup', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  if (username.toLowerCase() === 'admin') {
    return res.status(400).json({ error: 'Username reserved' });
  }
  
  try {
    const info = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, 'user')").run(username, password);
    const user = { id: info.lastInsertRowid, username, role: 'user' };
    const token = jwt.sign(user, JWT_SECRET);
    res.json({ data: { user, token }, error: null });
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ data: null, error: 'Username already exists' });
    } else {
      res.status(500).json({ data: null, error: err.message });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
