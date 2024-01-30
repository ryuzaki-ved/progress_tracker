import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

// IndexedDB key for persistence
const DB_KEY = 'progress_tracker_sqlite_db';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

// Schema for users and stocks (now with created_at)
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
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
  index_value REAL NOT NULL,
  daily_change REAL DEFAULT 0,
  change_percent REAL DEFAULT 0,
  commentary TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, date)
);
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY,
  cash_balance REAL DEFAULT 10000000,
  -- add other user settings columns here
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
`;

// Migration: add created_at to stocks and tasks if missing
function migrateStocksTable(db: Database) {
  const res = db.exec("PRAGMA table_info(stocks);");
  const columns = res[0]?.values?.map((row: any) => row[1]) || [];
  if (!columns.includes('created_at')) {
    db.run("ALTER TABLE stocks ADD COLUMN created_at TEXT;");
    db.run("UPDATE stocks SET created_at = datetime('now') WHERE created_at IS NULL;");
  }
  if (!columns.includes('current_score')) {
    db.run("ALTER TABLE stocks ADD COLUMN current_score REAL DEFAULT 500;");
    db.run("UPDATE stocks SET current_score = 500 WHERE current_score IS NULL;");
  }
  if (!columns.includes('last_activity_at')) {
    db.run("ALTER TABLE stocks ADD COLUMN last_activity_at TEXT;");
  }
}
function migrateTasksTable(db: Database) {
  const res = db.exec("PRAGMA table_info(tasks);");
  const columns = res[0]?.values?.map((row: any) => row[1]) || [];
  if (!columns.includes('created_at')) {
    db.run("ALTER TABLE tasks ADD COLUMN created_at TEXT;");
    db.run("UPDATE tasks SET created_at = datetime('now') WHERE created_at IS NULL;");
  }
  if (!columns.includes('score')) {
    db.run("ALTER TABLE tasks ADD COLUMN score REAL;");
  }
  if (!columns.includes('estimated_duration')) {
    db.run("ALTER TABLE tasks ADD COLUMN estimated_duration INTEGER;");
  }
  if (!columns.includes('scheduled_time')) {
    db.run("ALTER TABLE tasks ADD COLUMN scheduled_time TEXT;");
  }
}
function migrateStockPerformanceHistoryTable(db: Database) {
  const res = db.exec("PRAGMA table_info(stock_performance_history);");
  if (!res[0]) {
    db.run(`CREATE TABLE IF NOT EXISTS stock_performance_history (
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
    );`);
  }
}
function migrateIndexHistoryTable(db: Database) {
  const res = db.exec("PRAGMA table_info(index_history);");
  const columns = res[0]?.values?.map((row: any) => row[1]) || [];
  if (!columns.includes('created_at')) {
    db.run("ALTER TABLE index_history ADD COLUMN created_at TEXT;");
    db.run("UPDATE index_history SET created_at = datetime('now') WHERE created_at IS NULL;");
  }
  // Add UNIQUE constraint if missing (SQLite doesn't support ALTER TABLE ADD CONSTRAINT directly)
  // So, recreate the table if needed
  const indexRes = db.exec("PRAGMA index_list('index_history')");
  const hasUnique = indexRes[0]?.values?.some((row: any) => row[2] === 1 && row[1].includes('user_id') && row[1].includes('date'));
  if (!hasUnique) {
    // Remove duplicates, keep latest by created_at
    db.run(`DELETE FROM index_history WHERE id NOT IN (
      SELECT MAX(id) FROM index_history GROUP BY user_id, date
    )`);
    // Rename old table
    db.run("ALTER TABLE index_history RENAME TO index_history_old;");
    // Recreate table with UNIQUE constraint
    db.run(`CREATE TABLE index_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      index_value REAL NOT NULL,
      daily_change REAL DEFAULT 0,
      change_percent REAL DEFAULT 0,
      commentary TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, date)
    );`);
    // Copy data back
    db.run(`INSERT INTO index_history (user_id, date, index_value, daily_change, change_percent, commentary, created_at)
      SELECT user_id, date, index_value, daily_change, change_percent, commentary, created_at FROM index_history_old;
    `);
    // Drop old table
    db.run("DROP TABLE index_history_old;");
  }
}
function migrateUserSettingsTable(db: Database) {
  const res = db.exec("PRAGMA table_info(user_settings);");
  if (!res[0]) {
    db.run(`CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      cash_balance REAL DEFAULT 10000000,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );`);
  } else {
    const columns = res[0]?.values?.map((row: any) => row[1]) || [];
    if (!columns.includes('cash_balance')) {
      db.run("ALTER TABLE user_settings ADD COLUMN cash_balance REAL DEFAULT 10000000;");
    }
  }
  // Initialize cash_balance for all users if missing
  const usersRes = db.exec("SELECT id FROM users;");
  if (usersRes[0]) {
    const userIds = usersRes[0].values.map((row: any) => row[0]);
    userIds.forEach((userId: number) => {
      const settingsRes = db.exec(`SELECT cash_balance FROM user_settings WHERE user_id = ${userId};`);
      if (!settingsRes[0] || settingsRes[0].values.length === 0) {
        db.run(`INSERT INTO user_settings (user_id, cash_balance) VALUES (${userId}, 10000000);`);
      }
    });
  }
}
function migrateUserHoldingsTable(db: Database) {
  const res = db.exec("PRAGMA table_info(user_holdings);");
  if (!res[0]) {
    db.run(`CREATE TABLE IF NOT EXISTS user_holdings (
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
    );`);
  }
}
function migrateTransactionsTable(db: Database) {
  const res = db.exec("PRAGMA table_info(transactions);");
  if (!res[0]) {
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      stock_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      brokerage_fee REAL NOT NULL,
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(stock_id) REFERENCES stocks(id)
    );`);
  } else {
    const columns = res[0]?.values?.map((row: any) => row[1]) || [];
    if (!columns.includes('brokerage_fee')) {
      db.run('ALTER TABLE transactions ADD COLUMN brokerage_fee REAL NOT NULL DEFAULT 0;');
    }
    if (!columns.includes('timestamp')) {
      db.run('ALTER TABLE transactions ADD COLUMN timestamp TEXT;');
    }
    // Remove total_amount column if it exists
    if (columns.includes('total_amount')) {
      // 1. Rename old table
      db.run('ALTER TABLE transactions RENAME TO transactions_old;');
      // 2. Create new table without total_amount
      db.run(`CREATE TABLE transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        stock_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        quantity REAL NOT NULL,
        price REAL NOT NULL,
        brokerage_fee REAL NOT NULL,
        timestamp TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(stock_id) REFERENCES stocks(id)
      );`);
      // 3. Copy data (excluding total_amount)
      db.run(`INSERT INTO transactions (id, user_id, stock_id, type, quantity, price, brokerage_fee, timestamp)
        SELECT id, user_id, stock_id, type, quantity, price, brokerage_fee, timestamp FROM transactions_old;
      `);
      // 4. Drop old table
      db.run('DROP TABLE transactions_old;');
    }
  }
}
function migrateNotesTable(db: Database) {
  const res = db.exec("PRAGMA table_info(notes);");
  if (!res[0]) {
    db.run(`CREATE TABLE IF NOT EXISTS notes (
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
    );`);
  }
}

// Load database from IndexedDB
async function loadDatabase(): Promise<Database> {
  if (!SQL) SQL = await initSqlJs({ locateFile: (file: any) => 'public/sql-wasm.wasm' });
  const saved = await loadFromIndexedDB(DB_KEY);
  db = saved ? new SQL.Database(new Uint8Array(saved)) : new SQL.Database();
  db.exec(SCHEMA);
  migrateStocksTable(db);
  migrateTasksTable(db);
  migrateIndexHistoryTable(db);
  migrateStockPerformanceHistoryTable(db);
  migrateUserSettingsTable(db);
  migrateUserHoldingsTable(db);
  migrateTransactionsTable(db);
  migrateNotesTable(db);
  // Log initial cash balance after migrations
  const initialSettings = db.exec('SELECT cash_balance FROM user_settings WHERE user_id = 1');
  console.log('SQLite: Initial cash_balance after load/migrations:', initialSettings[0]?.values?.[0]?.[0]);
  return db;
}

// Save database to IndexedDB
async function saveDatabase() {
  if (db) {
    const data = db.export();
    await saveToIndexedDB(DB_KEY, data);
  }
}

// IndexedDB helpers
function loadFromIndexedDB(key: string): Promise<ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(key, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('db');
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('db', 'readonly');
      const store = tx.objectStore('db');
      const getReq = store.get('sqlite');
      getReq.onsuccess = () => resolve(getReq.result || null);
      getReq.onerror = () => resolve(null);
    };
    req.onerror = () => resolve(null);
  });
}
function saveToIndexedDB(key: string, data: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(key, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('db');
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('db', 'readwrite');
      const store = tx.objectStore('db');
      // Log before saving to IndexedDB
      console.log('SQLite: Saving database to IndexedDB...');
      store.put(data, 'sqlite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    };
    req.onerror = () => resolve();
  });
}

export async function getDb() {
  if (!db) await loadDatabase();
  return db!;
}
export async function persistDb() {
  await saveDatabase();
} 