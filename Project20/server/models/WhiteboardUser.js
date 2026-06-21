const { v4: uuidv4 } = require('uuid');
const { prepare } = require('../config/database');

const WhiteboardUserModel = {
  addUser(whiteboardId, userId, permission = 'read') {
    const id = uuidv4();
    const stmt = prepare(`
      INSERT OR IGNORE INTO whiteboard_users (id, whiteboard_id, user_id, permission)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run([id, whiteboardId, userId, permission]);
    stmt.free();
    return this.findByWhiteboardAndUser(whiteboardId, userId);
  },

  findByWhiteboardAndUser(whiteboardId, userId) {
    const stmt = prepare(`
      SELECT wu.*, u.username
      FROM whiteboard_users wu
      LEFT JOIN users u ON wu.user_id = u.id
      WHERE wu.whiteboard_id = ? AND wu.user_id = ?
    `);
    const result = stmt.get([whiteboardId, userId]);
    stmt.free();
    return result;
  },

  findByWhiteboard(whiteboardId) {
    const stmt = prepare(`
      SELECT wu.*, u.username
      FROM whiteboard_users wu
      LEFT JOIN users u ON wu.user_id = u.id
      WHERE wu.whiteboard_id = ?
    `);
    const results = stmt.all([whiteboardId]);
    stmt.free();
    return results;
  },

  updatePermission(whiteboardId, userId, permission) {
    const stmt = prepare(`
      UPDATE whiteboard_users
      SET permission = ?
      WHERE whiteboard_id = ? AND user_id = ?
    `);
    stmt.run([permission, whiteboardId, userId]);
    stmt.free();
    return this.findByWhiteboardAndUser(whiteboardId, userId);
  },

  removeUser(whiteboardId, userId) {
    const stmt = prepare(`
      DELETE FROM whiteboard_users
      WHERE whiteboard_id = ? AND user_id = ?
    `);
    const result = stmt.run([whiteboardId, userId]);
    stmt.free();
    return result;
  },

  hasPermission(whiteboardId, userId, minPermission = 'read') {
    const permissionOrder = { read: 1, write: 2, admin: 3 };
    const relation = this.findByWhiteboardAndUser(whiteboardId, userId);
    if (!relation) return false;
    return permissionOrder[relation.permission] >= permissionOrder[minPermission];
  }
};

module.exports = WhiteboardUserModel;
