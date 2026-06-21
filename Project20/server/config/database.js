const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = process.env.DB_DIR || path.join(__dirname, '..');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'whiteboard.db');

let db = null;
let SQL = null;

async function initDatabase() {
  SQL = await initSqlJs({
    locateFile: file => require.resolve(`sql.js/dist/${file}`)
  });

  let dbData = null;
  if (fs.existsSync(dbPath)) {
    dbData = fs.readFileSync(dbPath);
  }

  db = new SQL.Database(dbData);

  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  createTables();

  const userCount = db.exec('SELECT COUNT(*) as count FROM users')[0].values[0][0];
  if (userCount === 0) {
    const { v4: uuidv4 } = require('uuid');
    const adminId = uuidv4();
    const hashedPassword = bcrypt.hashSync('admin123', 10);

    const insertAdmin = db.prepare(`
      INSERT INTO users (id, username, password)
      VALUES (?, ?, ?)
    `);
    insertAdmin.run([adminId, 'admin', hashedPassword]);
    insertAdmin.free();

    const whiteboardId = uuidv4();
    const defaultData = JSON.stringify({
      elements: [],
      background: '#ffffff',
      width: 1920,
      height: 1080
    });

    const insertWhiteboard = db.prepare(`
      INSERT INTO whiteboards (id, name, owner_id, current_data)
      VALUES (?, ?, ?, ?)
    `);
    insertWhiteboard.run([whiteboardId, '默认白板', adminId, defaultData]);
    insertWhiteboard.free();

    const wbUserId = uuidv4();
    const insertWbUser = db.prepare(`
      INSERT INTO whiteboard_users (id, whiteboard_id, user_id, permission)
      VALUES (?, ?, ?, ?)
    `);
    insertWbUser.run([wbUserId, whiteboardId, adminId, 'admin']);
    insertWbUser.free();

    saveDatabase();

    console.log('测试数据初始化完成:');
    console.log('  默认用户: admin / admin123');
    console.log('  默认白板: 默认白板');
  }

  setInterval(saveDatabase, 5000);
}

function saveDatabase() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('保存数据库失败:', err);
  }
}

function createTables() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `;

  const createWhiteboardsTable = `
    CREATE TABLE IF NOT EXISTS whiteboards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      current_data TEXT DEFAULT '{}',
      version INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `;

  const createWhiteboardUsersTable = `
    CREATE TABLE IF NOT EXISTS whiteboard_users (
      id TEXT PRIMARY KEY,
      whiteboard_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      permission TEXT NOT NULL CHECK(permission IN ('read', 'write', 'admin')),
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(whiteboard_id, user_id)
    )
  `;

  const createVersionsTable = `
    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      whiteboard_id TEXT NOT NULL,
      data TEXT NOT NULL,
      snapshot_name TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `;

  const createOperationsTable = `
    CREATE TABLE IF NOT EXISTS operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      whiteboard_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      op_type TEXT NOT NULL,
      op_data TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      version_id TEXT,
      op_seq INTEGER NOT NULL DEFAULT 0
    )
  `;

  db.run(createUsersTable);
  db.run(createWhiteboardsTable);
  db.run(createWhiteboardUsersTable);
  db.run(createVersionsTable);
  db.run(createOperationsTable);
}

function getDB() {
  return db;
}

function prepare(sql) {
  const stmt = db.prepare(sql);
  return {
    run(params = []) {
      const p = Array.isArray(params) ? params : [params];
      stmt.bind(p);
      stmt.step();
      const info = {
        changes: db.getRowsModified(),
        lastInsertRowid: getLastInsertId()
      };
      stmt.reset();
      return info;
    },
    get(params = []) {
      const p = Array.isArray(params) ? params : [params];
      stmt.bind(p);
      let result = null;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.reset();
      return result;
    },
    all(params = []) {
      const p = Array.isArray(params) ? params : [params];
      stmt.bind(p);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.reset();
      return results;
    },
    free() {
      stmt.free();
    }
  };
}

function getLastInsertId() {
  const result = db.exec('SELECT last_insert_rowid() as id');
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0];
  }
  return null;
}

function exec(sql) {
  return db.exec(sql);
}

function pragma(sql) {
  return db.exec(`PRAGMA ${sql}`);
}

process.on('exit', saveDatabase);
process.on('SIGINT', () => {
  saveDatabase();
  process.exit(0);
});

module.exports = {
  initDatabase,
  saveDatabase,
  getDB,
  prepare,
  exec,
  pragma
};
