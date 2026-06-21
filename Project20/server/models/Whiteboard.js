const { v4: uuidv4 } = require('uuid');
const { prepare } = require('../config/database');

const WhiteboardModel = {
  create(name, ownerId) {
    const id = uuidv4();
    const defaultData = JSON.stringify({
      elements: [],
      background: '#ffffff',
      width: 1920,
      height: 1080
    });

    const stmt = prepare(`
      INSERT INTO whiteboards (id, name, owner_id, current_data)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run([id, name, ownerId, defaultData]);
    stmt.free();

    const wbUserId = uuidv4();
    const stmt2 = prepare(`
      INSERT INTO whiteboard_users (id, whiteboard_id, user_id, permission)
      VALUES (?, ?, ?, ?)
    `);
    stmt2.run([wbUserId, id, ownerId, 'admin']);
    stmt2.free();

    return this.findById(id);
  },

  findById(id) {
    const stmt = prepare(`
      SELECT w.*, u.username as owner_name
      FROM whiteboards w
      LEFT JOIN users u ON w.owner_id = u.id
      WHERE w.id = ?
    `);
    const result = stmt.get([id]);
    stmt.free();
    if (result && result.current_data) {
      result.current_data = JSON.parse(result.current_data);
    }
    return result;
  },

  findByUserId(userId) {
    const stmt = prepare(`
      SELECT w.*, u.username as owner_name
      FROM whiteboards w
      LEFT JOIN users u ON w.owner_id = u.id
      INNER JOIN whiteboard_users wu ON wu.whiteboard_id = w.id
      WHERE wu.user_id = ?
      ORDER BY w.updated_at DESC
    `);
    const results = stmt.all([userId]);
    stmt.free();
    return results;
  },

  update(id, { name, current_data, version }) {
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (current_data !== undefined) {
      updates.push('current_data = ?');
      params.push(typeof current_data === 'string' ? current_data : JSON.stringify(current_data));
    }
    if (version !== undefined) {
      updates.push('version = ?');
      params.push(version);
    }

    updates.push("updated_at = datetime('now', 'localtime')");
    params.push(id);

    const stmt = prepare(`
      UPDATE whiteboards SET ${updates.join(', ')} WHERE id = ?
    `);
    stmt.run(params);
    stmt.free();
    return this.findById(id);
  },

  updateData(id, current_data, version) {
    const stmt = prepare(`
      UPDATE whiteboards
      SET current_data = ?, version = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);
    const dataStr = typeof current_data === 'string' ? current_data : JSON.stringify(current_data);
    stmt.run([dataStr, version, id]);
    stmt.free();
  },

  delete(id) {
    const stmt = prepare('DELETE FROM whiteboards WHERE id = ?');
    const result = stmt.run([id]);
    stmt.free();
    return result;
  },

  list() {
    const stmt = prepare(`
      SELECT w.*, u.username as owner_name
      FROM whiteboards w
      LEFT JOIN users u ON w.owner_id = u.id
      ORDER BY w.updated_at DESC
    `);
    const results = stmt.all();
    stmt.free();
    return results;
  }
};

module.exports = WhiteboardModel;
