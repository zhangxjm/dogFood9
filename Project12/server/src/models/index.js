const { prepare, exec, transaction } = require('../database');

const Platform = {
  getAll() {
    return prepare('SELECT * FROM platforms ORDER BY id').all();
  },

  getById(id) {
    return prepare('SELECT * FROM platforms WHERE id = ?').get(id);
  },

  getByName(name) {
    return prepare('SELECT * FROM platforms WHERE name = ?').get(name);
  },

  create(name, displayName, logo) {
    const existing = this.getByName(name);
    if (existing) return existing;
    
    const result = prepare(
      'INSERT INTO platforms (name, display_name, logo) VALUES (?, ?, ?)'
    ).run(name, displayName, logo);
    return { id: result.lastInsertRowid, name, display_name: displayName, logo };
  },
};

const LiveRoom = {
  getAll() {
    return prepare(`
      SELECT lr.*, p.name as platform_name, p.display_name as platform_display_name
      FROM live_rooms lr
      JOIN platforms p ON lr.platform_id = p.id
      ORDER BY lr.id
    `).all();
  },

  getByPlatform(platformId) {
    return prepare(`
      SELECT * FROM live_rooms WHERE platform_id = ? AND is_live = 1 ORDER BY id
    `).all(platformId);
  },

  getById(id) {
    return prepare(`
      SELECT lr.*, p.name as platform_name, p.display_name as platform_display_name
      FROM live_rooms lr
      JOIN platforms p ON lr.platform_id = p.id
      WHERE lr.id = ?
    `).get(id);
  },

  create(platformId, roomId, title, streamerName, avatar, category) {
    const existing = prepare(
      'SELECT * FROM live_rooms WHERE platform_id = ? AND room_id = ?'
    ).get(platformId, roomId);
    
    if (existing) return existing;
    
    const result = prepare(`
      INSERT INTO live_rooms 
      (platform_id, room_id, title, streamer_name, avatar, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(platformId, roomId, title, streamerName, avatar, category);
    
    return { 
      id: result.lastInsertRowid, 
      platform_id: platformId, 
      room_id: roomId, 
      title, 
      streamer_name: streamerName, 
      avatar, 
      category, 
      is_live: 1 
    };
  },

  updateStatus(id, isLive) {
    return prepare('UPDATE live_rooms SET is_live = ? WHERE id = ?').run(isLive, id);
  },
};

const LiveMetric = {
  insert(metric) {
    const result = prepare(`
      INSERT INTO live_metrics 
      (room_id, viewer_count, like_count, comment_count, share_count, gift_count, gift_value, 
       product_click_count, order_count, order_amount, conversion_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      metric.room_id,
      metric.viewer_count || 0,
      metric.like_count || 0,
      metric.comment_count || 0,
      metric.share_count || 0,
      metric.gift_count || 0,
      metric.gift_value || 0,
      metric.product_click_count || 0,
      metric.order_count || 0,
      metric.order_amount || 0,
      metric.conversion_rate || 0
    );
    return { id: result.lastInsertRowid, ...metric };
  },

  bulkInsert(metrics) {
    transaction(() => {
      const insert = prepare(`
        INSERT INTO live_metrics 
        (room_id, viewer_count, like_count, comment_count, share_count, gift_count, gift_value,
         product_click_count, order_count, order_amount, conversion_rate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      for (const m of metrics) {
        insert.run(
          m.room_id,
          m.viewer_count || 0,
          m.like_count || 0,
          m.comment_count || 0,
          m.share_count || 0,
          m.gift_count || 0,
          m.gift_value || 0,
          m.product_click_count || 0,
          m.order_count || 0,
          m.order_amount || 0,
          m.conversion_rate || 0
        );
      }
    });
  },

  getLatestByRoom(roomId) {
    return prepare(`
      SELECT * FROM live_metrics 
      WHERE room_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `).get(roomId);
  },

  getHistoryByRoom(roomId, startTime, endTime) {
    let query = 'SELECT * FROM live_metrics WHERE room_id = ?';
    const params = [roomId];
    
    if (startTime) {
      query += ' AND timestamp >= ?';
      params.push(startTime);
    }
    if (endTime) {
      query += ' AND timestamp <= ?';
      params.push(endTime);
    }
    
    query += ' ORDER BY timestamp ASC';
    return prepare(query).all(...params);
  },

  getAggregatedByRoom(roomId, startTime, endTime, granularity = 'minute') {
    let timeFormat;
    switch (granularity) {
      case 'hour':
        timeFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'minute':
      default:
        timeFormat = '%Y-%m-%d %H:%M:00';
        break;
    }
    
    let query = `
      SELECT 
        strftime(?, timestamp) as time_bucket,
        AVG(viewer_count) as avg_viewer_count,
        MAX(viewer_count) as max_viewer_count,
        MIN(viewer_count) as min_viewer_count,
        SUM(like_count) as total_likes,
        SUM(comment_count) as total_comments,
        SUM(share_count) as total_shares,
        SUM(gift_count) as total_gifts,
        SUM(gift_value) as total_gift_value,
        SUM(product_click_count) as total_product_clicks,
        SUM(order_count) as total_orders,
        SUM(order_amount) as total_order_amount,
        AVG(conversion_rate) as avg_conversion_rate
      FROM live_metrics
      WHERE room_id = ?
    `;
    
    const params = [timeFormat, roomId];
    
    if (startTime) {
      query += ' AND timestamp >= ?';
      params.push(startTime);
    }
    if (endTime) {
      query += ' AND timestamp <= ?';
      params.push(endTime);
    }
    
    query += ' GROUP BY time_bucket ORDER BY time_bucket ASC';
    return prepare(query).all(...params);
  },

  getPlatformOverview(platformId, startTime, endTime) {
    let query = `
      SELECT 
        lr.id as room_id,
        lr.title,
        lr.streamer_name,
        MAX(lm.viewer_count) as peak_viewers,
        AVG(lm.viewer_count) as avg_viewers,
        SUM(lm.like_count) as total_likes,
        SUM(lm.comment_count) as total_comments,
        SUM(lm.gift_value) as total_gift_value,
        SUM(lm.product_click_count) as total_clicks,
        SUM(lm.order_count) as total_orders,
        SUM(lm.order_amount) as total_gmv
      FROM live_rooms lr
      LEFT JOIN live_metrics lm ON lr.id = lm.room_id
      WHERE lr.platform_id = ?
    `;
    
    const params = [platformId];
    
    if (startTime) {
      query += ' AND lm.timestamp >= ?';
      params.push(startTime);
    }
    if (endTime) {
      query += ' AND lm.timestamp <= ?';
      params.push(endTime);
    }
    
    query += ' GROUP BY lr.id ORDER BY peak_viewers DESC';
    return prepare(query).all(...params);
  },

  getRealTimeAllRooms() {
    return prepare(`
      SELECT 
        lm.room_id,
        lr.title,
        lr.streamer_name,
        p.name as platform,
        p.display_name as platform_name,
        lm.viewer_count,
        lm.like_count,
        lm.comment_count,
        lm.gift_value,
        lm.product_click_count,
        lm.order_count,
        lm.conversion_rate,
        lm.timestamp
      FROM live_metrics lm
      JOIN live_rooms lr ON lm.room_id = lr.id
      JOIN platforms p ON lr.platform_id = p.id
      WHERE lr.is_live = 1
      AND lm.timestamp = (
        SELECT MAX(timestamp) FROM live_metrics lm2 WHERE lm2.room_id = lm.room_id
      )
      ORDER BY lm.viewer_count DESC
    `).all();
  },
};

const Product = {
  getByRoom(roomId) {
    return prepare('SELECT * FROM products WHERE room_id = ? ORDER BY order_amount DESC').all(roomId);
  },

  createOrUpdate(product) {
    const existing = prepare(
      'SELECT * FROM products WHERE room_id = ? AND product_id = ?'
    ).get(product.room_id, product.product_id);
    
    if (existing) {
      prepare(`
        UPDATE products 
        SET click_count = click_count + ?, 
            order_count = order_count + ?, 
            order_amount = order_amount + ?
        WHERE id = ?
      `).run(product.click_count || 0, product.order_count || 0, product.order_amount || 0, existing.id);
      
      return prepare('SELECT * FROM products WHERE id = ?').get(existing.id);
    } else {
      const result = prepare(`
        INSERT INTO products (room_id, product_id, name, price, image, click_count, order_count, order_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        product.room_id,
        product.product_id,
        product.name,
        product.price || 0,
        product.image || '',
        product.click_count || 0,
        product.order_count || 0,
        product.order_amount || 0
      );
      return { id: result.lastInsertRowid, ...product };
    }
  },

  getTopProducts(limit = 10, startTime, endTime) {
    let query = `
      SELECT 
        p.*,
        lr.title as room_title,
        lr.streamer_name
      FROM products p
      JOIN live_rooms lr ON p.room_id = lr.id
      WHERE 1=1
    `;
    const params = [];
    
    if (startTime) {
      query += ' AND p.created_at >= ?';
      params.push(startTime);
    }
    
    query += ' ORDER BY p.order_amount DESC LIMIT ?';
    params.push(limit);
    
    return prepare(query).all(...params);
  },
};

module.exports = {
  Platform,
  LiveRoom,
  LiveMetric,
  Product,
};
