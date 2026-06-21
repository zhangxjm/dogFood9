const { v4: uuidv4 } = require('uuid');
const { prepare } = require('../config/database');

const VersionModel = {
  create(whiteboardId, data, snapshotName, createdBy) {
    const id = uuidv4();
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    const stmt = prepare(`
      INSERT INTO versions (id, whiteboard_id, data, snapshot_name, created_by)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run([id, whiteboardId, dataStr, snapshotName, createdBy]);
    stmt.free();
    return this.findById(id);
  },

  findById(id) {
    const stmt = prepare(`
      SELECT v.*, u.username as created_by_name
      FROM versions v
      LEFT JOIN users u ON v.created_by = u.id
      WHERE v.id = ?
    `);
    const result = stmt.get([id]);
    stmt.free();
    if (result && result.data) {
      result.data = JSON.parse(result.data);
    }
    return result;
  },

  findByWhiteboard(whiteboardId) {
    const stmt = prepare(`
      SELECT v.id, v.whiteboard_id, v.snapshot_name, v.created_by, v.created_at, v.data,
             u.username as created_by_name
      FROM versions v
      LEFT JOIN users u ON v.created_by = u.id
      WHERE v.whiteboard_id = ?
      ORDER BY v.created_at DESC
    `);
    const results = stmt.all([whiteboardId]);
    stmt.free();
    return results.map(row => {
      if (row.data) {
        try {
          row.data = JSON.parse(row.data);
        } catch (e) {
          row.data = {};
        }
      }
      return row;
    });
  },

  delete(id) {
    const stmt = prepare('DELETE FROM versions WHERE id = ?');
    const result = stmt.run([id]);
    stmt.free();
    return result;
  }
};

module.exports = VersionModel;
