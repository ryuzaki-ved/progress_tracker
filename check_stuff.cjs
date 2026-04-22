const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

const tasks = db.prepare(`SELECT * FROM tasks WHERE stock_id = 12 AND (status = 'failed' OR updated_at LIKE '2026-04-20%')`).all();
console.log("Tasks modified/failed on 20th:");
console.table(tasks);

const options = db.prepare(`SELECT * FROM option_transactions WHERE timestamp LIKE '2026-04-20%'`).all();
console.log("Option Transactions:");
console.table(options);

const bonds = db.prepare(`SELECT * FROM performance_bonds`).all();
console.log("Performance Bonds:");
console.table(bonds);
