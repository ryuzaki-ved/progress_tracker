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
  password TEXT NOT NULL,
  cash_balance REAL DEFAULT 10000 -- New column for cash balance, default $10,000
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
CREATE TABLE IF NOT EXISTS holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  stock_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  avg_buy_price REAL NOT NULL,
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
  total_amount REAL NOT NULL,
  transaction_date TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(stock_id) REFERENCES stocks(id)
);
`;

// Migration: add created_at to stocks and tasks if missing
function migrateStocksTable(db: Database) {
  const res = db.exec("PRAGMA table_info(stocks);");
  const columns = res[0]?.values?.map(row => row[1]) || [];
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
  const columns = res[0]?.values?.map(row => row[1]) || [];
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
  const columns = res[0]?.values?.map(row => row[1]) || [];
  if (!columns.includes('created_at')) {
    db.run("ALTER TABLE index_history ADD COLUMN created_at TEXT;");
    db.run("UPDATE index_history SET created_at = datetime('now') WHERE created_at IS NULL;");
  }
  // Add UNIQUE constraint if missing (SQLite doesn't support ALTER TABLE ADD CONSTRAINT directly)
  // So, recreate the table if needed
  const indexRes = db.exec("PRAGMA index_list('index_history')");
  const hasUnique = indexRes[0]?.values?.some(row => row[2] === 1 && row[1].includes('user_id') && row[1].includes('date'));
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
function migrateUsersTable(db: Database) {
  const res = db.exec("PRAGMA table_info(users);");
  const columns = res[0]?.values?.map(row => row[1]) || [];
  if (!columns.includes('cash_balance')) {
    try {
      db.run("ALTER TABLE users ADD COLUMN cash_balance REAL DEFAULT 10000;");
      db.run("UPDATE users SET cash_balance = 10000 WHERE cash_balance IS NULL;");
    } catch (e) {
      // Ignore error if column already exists
    }
  }
}
function migrateHoldingsTable(db: Database) {
  const res = db.exec("PRAGMA table_info(holdings);");
  if (!res[0]) {
    db.run(`CREATE TABLE IF NOT EXISTS holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      stock_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      avg_buy_price REAL NOT NULL,
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
      total_amount REAL NOT NULL,
      transaction_date TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(stock_id) REFERENCES stocks(id)
    );`);
  }
}

// Load database from IndexedDB
async function loadDatabase(): Promise<Database> {
  if (!SQL) SQL = await initSqlJs({ locateFile: file => 'public/sql-wasm.wasm' });
  const saved = await loadFromIndexedDB(DB_KEY);
  db = saved ? new SQL.Database(new Uint8Array(saved)) : new SQL.Database();
  db.exec(SCHEMA);
  migrateUsersTable(db); // New migration for users
  migrateStocksTable(db);
  migrateTasksTable(db);
  migrateIndexHistoryTable(db);
  migrateStockPerformanceHistoryTable(db);
  migrateHoldingsTable(db); // New migration for holdings
  migrateTransactionsTable(db); // New migration for transactions
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