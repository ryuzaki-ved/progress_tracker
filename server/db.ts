import Database from 'better-sqlite3';
import { join } from 'path';

// Schema for users and stocks (now with created_at)
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  show_in_leaderboard BOOLEAN DEFAULT 0
);
CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  used BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS stocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  color TEXT,
  weight REAL,
  icon TEXT,
  current_score REAL DEFAULT 500,
  last_activity_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  is_archived BOOLEAN DEFAULT 0,
  UNIQUE(user_id, name),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stock_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'one_time',
  priority TEXT DEFAULT 'medium',
  complexity INTEGER DEFAULT 3,
  estimated_duration INTEGER,
  scheduled_time TEXT,
  points INTEGER DEFAULT 10,
  due_date TEXT,
  status TEXT DEFAULT 'pending',
  completed_at TEXT,
  skipped_at TEXT,
  cancelled_at TEXT,
  recurring_pattern TEXT,
  parent_task_id INTEGER,
  score REAL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT,
  FOREIGN KEY(stock_id) REFERENCES stocks(id),
  FOREIGN KEY(parent_task_id) REFERENCES tasks(id)
);
CREATE TABLE IF NOT EXISTS stock_performance_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stock_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  daily_score REAL NOT NULL,
  score_delta REAL DEFAULT 0,
  delta_percent REAL DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_overdue INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(stock_id) REFERENCES stocks(id)
);
CREATE TABLE IF NOT EXISTS index_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  open REAL NOT NULL,
  high REAL NOT NULL,
  low REAL NOT NULL,
  close REAL NOT NULL,
  daily_change REAL DEFAULT 0,
  change_percent REAL DEFAULT 0,
  commentary TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, date)
);
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY,
  cash_balance REAL DEFAULT 10000000,
  index_divisor REAL DEFAULT 1.0,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS user_holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  stock_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  weighted_avg_buy_price REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT,
  UNIQUE(user_id, stock_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(stock_id) REFERENCES stocks(id)
);
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  stock_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'buy' or 'sell'
  quantity REAL NOT NULL,
  price REAL NOT NULL,
  brokerage_fee REAL NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(stock_id) REFERENCES stocks(id)
);
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  tags TEXT DEFAULT '[]',
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#3B82F6',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS options_contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strike_price REAL NOT NULL,
  expiry_date TEXT NOT NULL,
  option_type TEXT NOT NULL, -- 'CE' or 'PE'
  underlying_index_value_at_creation REAL NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS option_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  contract_id INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'buy' or 'write'
  quantity INTEGER NOT NULL,
  premium_per_unit REAL NOT NULL,
  total_premium REAL NOT NULL,
  timestamp TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(contract_id) REFERENCES options_contracts(id)
);
CREATE TABLE IF NOT EXISTS user_options_holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  contract_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'long_ce', 'short_ce', 'long_pe', 'short_pe'
  weighted_avg_premium REAL NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(contract_id) REFERENCES options_contracts(id)
);
CREATE TABLE IF NOT EXISTS option_pnl_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  contract_id INTEGER NOT NULL,
  position_type TEXT NOT NULL, -- 'long_ce', 'short_ce', 'long_pe', 'short_pe'
  quantity INTEGER NOT NULL,
  entry_premium REAL NOT NULL,
  exit_premium REAL NOT NULL,
  pnl REAL NOT NULL,
  pnl_percent REAL NOT NULL,
  exit_type TEXT NOT NULL, -- 'manual', 'expiry'
  exit_date TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(contract_id) REFERENCES options_contracts(id)
);
`;

const db = new Database(join(process.cwd(), 'database.sqlite'));

// Create tables
db.exec(SCHEMA);

// Ensure admin exists
const stmt = db.prepare("SELECT id FROM users WHERE username = 'admin'");
const adminExists = stmt.get();
if (!adminExists) {
  db.prepare("INSERT INTO users (username, password, role) VALUES ('admin', 'admin157', 'admin')").run();
} else {
  db.prepare("UPDATE users SET role = 'admin', password = 'admin157' WHERE username = 'admin'").run();
}

// Ensure columns and migrations
try { db.prepare("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'").run(); } catch (e) {}
try { db.prepare("ALTER TABLE stocks ADD COLUMN created_at TEXT DEFAULT (datetime('now'))").run(); } catch (e) {}
try { db.prepare("ALTER TABLE stocks ADD COLUMN current_score REAL DEFAULT 500").run(); } catch (e) {}
try { db.prepare("ALTER TABLE stocks ADD COLUMN last_activity_at TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE tasks ADD COLUMN created_at TEXT DEFAULT (datetime('now'))").run(); } catch (e) {}
try { db.prepare("ALTER TABLE tasks ADD COLUMN score REAL").run(); } catch (e) {}
try { db.prepare("ALTER TABLE tasks ADD COLUMN estimated_duration INTEGER").run(); } catch (e) {}
try { db.prepare("ALTER TABLE tasks ADD COLUMN scheduled_time TEXT").run(); } catch (e) {}
try { db.prepare("ALTER TABLE stocks ADD COLUMN is_archived BOOLEAN DEFAULT 0").run(); } catch (e) {}
try { db.prepare("ALTER TABLE users ADD COLUMN show_in_leaderboard BOOLEAN DEFAULT 0").run(); } catch (e) {}

try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'daily',
      date TEXT NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      mood TEXT,
      prompts TEXT,
      tags TEXT,
      is_private BOOLEAN DEFAULT true,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_activity_date TEXT,
      is_active BOOLEAN DEFAULT false,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS weekly_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      week_start TEXT NOT NULL,
      week_end TEXT NOT NULL,
      rating TEXT NOT NULL,
      stats TEXT NOT NULL,
      journal_entry_id INTEGER,
      insights TEXT,
      goals TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS reflection_insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      data TEXT,
      confidence TEXT DEFAULT 'medium',
      actionable BOOLEAN DEFAULT false,
      dismissed BOOLEAN DEFAULT false,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      stock_id TEXT,
      severity TEXT DEFAULT 'medium',
      is_read BOOLEAN DEFAULT false,
      is_dismissed BOOLEAN DEFAULT false,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      achievement_id TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      is_unlocked BOOLEAN DEFAULT false,
      unlocked_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, achievement_id)
    )
  `).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS performance_bonds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER NOT NULL,
      challenger_id INTEGER NOT NULL,
      creator_task_id INTEGER NOT NULL,
      challenger_task_id INTEGER,
      creator_amount INTEGER NOT NULL,
      challenger_amount INTEGER,
      creator_completed BOOLEAN DEFAULT 0,
      challenger_completed BOOLEAN DEFAULT 0,
      due_date TEXT NOT NULL,
      status TEXT DEFAULT 'pending_acceptance',
      winner TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY(creator_id) REFERENCES users(id),
      FOREIGN KEY(challenger_id) REFERENCES users(id),
      FOREIGN KEY(creator_task_id) REFERENCES tasks(id),
      FOREIGN KEY(challenger_task_id) REFERENCES tasks(id)
    )
  `).run();
  db.prepare(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
} catch (e) {}

// Ensure cash_balance initialization
try { db.prepare("ALTER TABLE user_settings ADD COLUMN cash_balance REAL DEFAULT 10000000").run(); } catch (e) {}
try { db.prepare("ALTER TABLE user_settings ADD COLUMN index_divisor REAL DEFAULT 1.0").run(); } catch (e) {}
const usersRes = db.prepare("SELECT id FROM users").all() as { id: number }[];
usersRes.forEach(u => {
  const settings = db.prepare('SELECT cash_balance, index_divisor FROM user_settings WHERE user_id = ?').get(u.id);
  if (!settings) {
    db.prepare('INSERT INTO user_settings (user_id, cash_balance, index_divisor) VALUES (?, 10000000, 1.0)').run(u.id);
  }
});

export default db;
