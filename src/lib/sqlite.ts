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
  created_at TEXT DEFAULT (datetime('now'))
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
}

// Load database from IndexedDB
async function loadDatabase(): Promise<Database> {
  if (!SQL) SQL = await initSqlJs({ locateFile: file => 'public/sql-wasm.wasm' });
  const saved = await loadFromIndexedDB(DB_KEY);
  db = saved ? new SQL.Database(new Uint8Array(saved)) : new SQL.Database();
  db.exec(SCHEMA);
  migrateStocksTable(db);
  migrateTasksTable(db);
  migrateIndexHistoryTable(db);
  migrateStockPerformanceHistoryTable(db);
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