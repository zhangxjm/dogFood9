const { getDb } = require('../utils/db');
const { captureError, captureMessage } = require('../utils/monitoring');
const { getStatusText } = require('../utils/helpers');
const { addJob } = require('../queues');
const config = require('../config');

class EquipmentService {
  static getAll(params = {}) {
    try {
      const db = getDb();
      const { page = 1, pageSize = 20, status, category, keyword } = params;
      
      let sql = 'SELECT * FROM equipment WHERE 1=1';
      const queryParams = [];
      
      if (status) {
        sql += ' AND status = ?';
        queryParams.push(status);
      }
      if (category) {
        sql += ' AND category = ?';
        queryParams.push(category);
      }
      if (keyword) {
        sql += ' AND (name LIKE ? OR equipment_code LIKE ? OR manufacturer LIKE ?)';
        queryParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
      
      const total = db.prepare(`SELECT COUNT(*) as count FROM (${sql})`).get(...queryParams).count;
      
      const offset = (page - 1) * pageSize;
      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(pageSize, offset);
      
      const list = db.prepare(sql).all(...queryParams).map(item => ({
        ...item,
        status_text: getStatusText(item.status),
      }));
      
      return { list, total, page, pageSize };
    } catch (error) {
      captureError(error, { module: 'EquipmentService', method: 'getAll' });
      throw error;
    }
  }

  static getById(id) {
    try {
      const db = getDb();
      const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(id);
      
      if (!equipment) {
        return null;
      }
      
      const lifecycleRecords = db.prepare(`
        SELECT * FROM lifecycle_records 
        WHERE equipment_id = ? 
        ORDER BY record_date DESC
      `).all(id);
      
      const maintenancePlans = db.prepare(`
        SELECT * FROM maintenance_plans 
        WHERE equipment_id = ? 
        ORDER BY created_at DESC
      `).all(id);
      
      const workOrders = db.prepare(`
        SELECT * FROM work_orders 
        WHERE equipment_id = ? 
        ORDER BY created_at DESC
      `).all(id);
      
      const healthRecords = db.prepare(`
        SELECT * FROM health_records 
        WHERE equipment_id = ? 
        ORDER BY check_date DESC 
        LIMIT 20
      `).all(id);
      
      return {
        ...equipment,
        status_text: getStatusText(equipment.status),
        lifecycle_records: lifecycleRecords,
        maintenance_plans: maintenancePlans,
        work_orders: workOrders,
        health_records: healthRecords,
      };
    } catch (error) {
      captureError(error, { module: 'EquipmentService', method: 'getById', id });
      throw error;
    }
  }

  static create(data) {
    try {
      const db = getDb();
      
      const result = db.prepare(`
        INSERT INTO equipment (equipment_code, name, category, model, manufacturer,
          serial_number, purchase_date, purchase_price, supplier, location, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.equipment_code,
        data.name,
        data.category,
        data.model,
        data.manufacturer,
        data.serial_number,
        data.purchase_date,
        data.purchase_price,
        data.supplier,
        data.location,
        data.description
      );

      this.addLifecycleRecord(result.lastInsertRowid, 'purchase', '采购入库', '系统管理员', '设备采购完成，已入库');
      
      captureMessage(`Equipment created: ${data.name}`, 'info', { module: 'EquipmentService', id: result.lastInsertRowid });
      
      return this.getById(result.lastInsertRowid);
    } catch (error) {
      captureError(error, { module: 'EquipmentService', method: 'create' });
      throw error;
    }
  }

  static update(id, data) {
    try {
      const db = getDb();
      
      const fields = [];
      const values = [];
      
      const allowedFields = ['name', 'category', 'model', 'manufacturer', 'serial_number', 
        'purchase_date', 'purchase_price', 'supplier', 'location', 'install_date', 
        'warranty_start', 'warranty_end', 'status', 'description'];
      
      allowedFields.forEach(field => {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      });
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      db.prepare(`UPDATE equipment SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      
      captureMessage(`Equipment updated: ${id}`, 'info', { module: 'EquipmentService', id });
      
      return this.getById(id);
    } catch (error) {
      captureError(error, { module: 'EquipmentService', method: 'update', id });
      throw error;
    }
  }

  static install(id, data) {
    try {
      const db = getDb();
      
      db.prepare(`
        UPDATE equipment 
        SET status = 'installed', install_date = ?, location = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(data.install_date, data.location, id);
      
      this.addLifecycleRecord(id, 'install', '安装调试', data.operator || '系统管理员', data.description || '设备安装调试完成');
      
      addJob(config.queues.healthCheck, 'health-check', { equipmentId: id });
      
      captureMessage(`Equipment installed: ${id}`, 'info', { module: 'EquipmentService', id });
      
      return this.getById(id);
    } catch (error) {
      captureError(error, { module: 'EquipmentService', method: 'install', id });
      throw error;
    }
  }

  static startOperation(id, operator) {
    try {
      const db = getDb();
      
      db.prepare(`
        UPDATE equipment 
        SET status = 'running', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);
      
      this.addLifecycleRecord(id, 'operation', '投入运行', operator || '系统管理员', '设备正式投入生产运行');
      
      captureMessage(`Equipment started operation: ${id}`, 'info', { module: 'EquipmentService', id });
      
      return this.getById(id);
    } catch (error) {
      captureError(error, { module: 'EquipmentService', method: 'startOperation', id });
      throw error;
    }
  }

  static scrap(id, data) {
    try {
      const db = getDb();
      
      db.prepare(`
        UPDATE equipment 
        SET status = 'scrapped', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(id);
      
      this.addLifecycleRecord(id, 'scrap', '设备报废', data.operator || '系统管理员', 
        data.reason || '设备达到使用年限，正常报废');
      
      captureMessage(`Equipment scrapped: ${id}`, 'warning', { module: 'EquipmentService', id });
      
      return this.getById(id);
    } catch (error) {
      captureError(error, { module: 'EquipmentService', method: 'scrap', id });
      throw error;
    }
  }

  static addLifecycleRecord(equipmentId, stage, action, operator, description) {
    try {
      const db = getDb();
      db.prepare(`
        INSERT INTO lifecycle_records (equipment_id, stage, action, operator, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(equipmentId, stage, action, operator, description);
    } catch (error) {
      captureError(error, { module: 'EquipmentService', method: 'addLifecycleRecord' });
      throw error;
    }
  }

  static delete(id) {
    try {
      const db = getDb();
      db.prepare('DELETE FROM equipment WHERE id = ?').run(id);
      captureMessage(`Equipment deleted: ${id}`, 'info', { module: 'EquipmentService', id });
      return true;
    } catch (error) {
      captureError(error, { module: 'EquipmentService', method: 'delete', id });
      throw error;
    }
  }

  static getStats() {
    try {
      const db = getDb();
      
      const total = db.prepare('SELECT COUNT(*) as count FROM equipment').get().count;
      
      const byStatus = db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM equipment 
        GROUP BY status
      `).all();
      
      const byCategory = db.prepare(`
        SELECT category, COUNT(*) as count 
        FROM equipment 
        GROUP BY category
      `).all();
      
      const totalValue = db.prepare('SELECT SUM(purchase_price) as total FROM equipment').get().total || 0;
      
      const avgHealth = db.prepare('SELECT AVG(health_score) as avg FROM equipment WHERE status = ?').get('running').avg || 0;
      
      return {
        total,
        total_value: totalValue,
        avg_health_score: Math.round(avgHealth),
        by_status: byStatus.map(s => ({ ...s, status_text: getStatusText(s.status) })),
        by_category: byCategory,
      };
    } catch (error) {
      captureError(error, { module: 'EquipmentService', method: 'getStats' });
      throw error;
    }
  }
}

module.exports = EquipmentService;
