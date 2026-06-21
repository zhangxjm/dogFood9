const { prepare, exec } = require('../config/database');

const OperationModel = {
  create(whiteboardId, userId, opType, opData, timestamp, opSeq, versionId = null) {
    const dataStr = typeof opData === 'string' ? opData : JSON.stringify(opData);
    const stmt = prepare(`
      INSERT INTO operations (whiteboard_id, user_id, op_type, op_data, timestamp, op_seq, version_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run([whiteboardId, userId, opType, dataStr, timestamp, opSeq, versionId]);
    stmt.free();
    return info.lastInsertRowid;
  },

  findById(id) {
    const stmt = prepare(`
      SELECT o.*, u.username as user_name
      FROM operations o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `);
    const result = stmt.get([id]);
    stmt.free();
    if (result && result.op_data) {
      result.op_data = JSON.parse(result.op_data);
    }
    return result;
  },

  findByWhiteboard(whiteboardId, limit = 100) {
    const stmt = prepare(`
      SELECT o.*, u.username as user_name
      FROM operations o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.whiteboard_id = ?
      ORDER BY o.op_seq ASC
      LIMIT ?
    `);
    const rows = stmt.all([whiteboardId, limit]);
    stmt.free();
    return rows.map(row => {
      if (row.op_data) {
        row.op_data = JSON.parse(row.op_data);
      }
      return row;
    });
  },

  findByWhiteboardSinceSeq(whiteboardId, sinceSeq, limit = 500) {
    const stmt = prepare(`
      SELECT o.*, u.username as user_name
      FROM operations o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.whiteboard_id = ? AND o.op_seq > ?
      ORDER BY o.op_seq ASC
      LIMIT ?
    `);
    const rows = stmt.all([whiteboardId, sinceSeq, limit]);
    stmt.free();
    return rows.map(row => {
      if (row.op_data) {
        row.op_data = JSON.parse(row.op_data);
      }
      return row;
    });
  },

  getMaxSeq(whiteboardId) {
    const stmt = prepare(`
      SELECT COALESCE(MAX(op_seq), 0) as max_seq
      FROM operations
      WHERE whiteboard_id = ?
    `);
    const result = stmt.get([whiteboardId]);
    stmt.free();
    return result ? (result.max_seq || 0) : 0;
  },

  deleteByWhiteboard(whiteboardId) {
    const stmt = prepare('DELETE FROM operations WHERE whiteboard_id = ?');
    const result = stmt.run([whiteboardId]);
    stmt.free();
    return result;
  }
};

module.exports = OperationModel;
