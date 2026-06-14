const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const config = require('../config');

let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();
  
  const dataDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (fs.existsSync(config.dbPath)) {
    const fileBuffer = fs.readFileSync(config.dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS platforms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      logo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS live_rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform_id INTEGER NOT NULL,
      room_id TEXT NOT NULL,
      title TEXT NOT NULL,
      streamer_name TEXT NOT NULL,
      avatar TEXT,
      category TEXT,
      is_live INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(platform_id, room_id),
      FOREIGN KEY (platform_id) REFERENCES platforms(id)
    );
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS live_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      viewer_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      gift_count INTEGER DEFAULT 0,
      gift_value REAL DEFAULT 0,
      product_click_count INTEGER DEFAULT 0,
      order_count INTEGER DEFAULT 0,
      order_amount REAL DEFAULT 0,
      conversion_rate REAL DEFAULT 0,
      FOREIGN KEY (room_id) REFERENCES live_rooms(id)
    );
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL DEFAULT 0,
      image TEXT,
      click_count INTEGER DEFAULT 0,
      order_count INTEGER DEFAULT 0,
      order_amount REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(room_id, product_id),
      FOREIGN KEY (room_id) REFERENCES live_rooms(id)
    );
  `);
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_metrics_room_timestamp ON live_metrics(room_id, timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON live_metrics(timestamp)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_products_room ON products(room_id)`);
  
  saveDatabase();
  console.log('Database initialized');
}

function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(config.dbPath, buffer);
  } catch (err) {
    console.warn('Failed to save database:', err.message);
  }
}

let saveTimer = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveDatabase();
    saveTimer = null;
  }, 1000);
}

function prepare(sql) {
  return {
    run(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      stmt.step();
      stmt.free();
      scheduleSave();
      
      const lastInsertId = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0];
      const changes = db.getRowsModified?.() || 1;
      return { lastInsertRowid: lastInsertId, changes };
    },
    
    get(...params) {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      
      let result = null;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();
      return result;
    },
    
    all(...params) {
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },
  };
}

function exec(sql) {
  db.run(sql);
  scheduleSave();
}

function transaction(fn) {
  db.run('BEGIN TRANSACTION');
  try {
    fn();
    db.run('COMMIT');
    scheduleSave();
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}

module.exports = {
  initDatabase,
  saveDatabase,
  prepare,
  exec,
  transaction,
  getDb: () => db,
};
