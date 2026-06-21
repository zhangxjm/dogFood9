const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { prepare } = require('../config/database');

const UserModel = {
  create(username, password) {
    const id = uuidv4();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = prepare(`
      INSERT INTO users (id, username, password)
      VALUES (?, ?, ?)
    `);
    stmt.run([id, username, hashedPassword]);
    stmt.free();
    return this.findById(id);
  },

  findById(id) {
    const stmt = prepare('SELECT id, username, created_at FROM users WHERE id = ?');
    const result = stmt.get([id]);
    stmt.free();
    return result;
  },

  findByUsername(username) {
    const stmt = prepare('SELECT * FROM users WHERE username = ?');
    const result = stmt.get([username]);
    stmt.free();
    return result;
  },

  verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password);
  },

  findAll() {
    const stmt = prepare('SELECT id, username, created_at FROM users');
    const results = stmt.all();
    stmt.free();
    return results;
  }
};

module.exports = UserModel;
