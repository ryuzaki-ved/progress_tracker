const Database = require('better-sqlite3');

try {
  const db = new Database('./database.sqlite');
  
  // Check maintenance mode
  const result = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('maintenance_mode');
  console.log('Current maintenance_mode value:', result?.value);
  
  // Reset to 0 (disabled)
  db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)').run('maintenance_mode', '0');
  console.log('✓ Reset maintenance mode to DISABLED');
  
  // Verify
  const verify = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('maintenance_mode');
  console.log('Verified maintenance_mode is now:', verify?.value);
  
  db.close();
} catch (err) {
  console.error('Error:', err.message);
}
