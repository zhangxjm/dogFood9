const { getDb } = require('../utils/db');
const { captureError, captureMessage } = require('../utils/monitoring');
const { generateOrderNo, getPriorityText } = require('../utils/helpers');
const { addJob } = require('../queues');
const config = require('../config');

const statusTextMap = {
  pending: '待处理',
  assigned: '已派单',
  in_progress: '处理中',
  completed: '已完成',
  cancelled: '已取消',
};

const typeTextMap = {
  maintenance: '维保',
  repair: '维修',
  inspection: '巡检',
  upgrade: '升级',
};

class WorkOrderService {
  static getAll(params = {}) {
    try {
      const db = getDb();
      const { page = 1, pageSize = 20, status, priority, type, equipmentId } = params;
      
      let sql = `
        SELECT wo.*, e.name as equipment_name, e.equipment_code, e.location,
               mp.plan_name as maintenance_plan_name
        FROM work_orders wo
        LEFT JOIN equipment e ON e.id = wo.equipment_id
        LEFT JOIN maintenance_plans mp ON mp.id = wo.plan_id
        WHERE 1=1
      `;
      const queryParams = [];
      
      if (status) {
        sql += ' AND wo.status = ?';
        queryParams.push(status);
      }
      if (priority) {
        sql += ' AND wo.priority = ?';
        queryParams.push(priority);
      }
      if (type) {
        sql += ' AND wo.order_type = ?';
        queryParams.push(type);
      }
      if (equipmentId) {
        sql += ' AND wo.equipment_id = ?';
        queryParams.push(equipmentId);
      }
      
      const total = db.prepare(`SELECT COUNT(*) as count FROM (${sql})`).get(...queryParams).count;
      
      const offset = (page - 1) * pageSize;
      sql += ` ORDER BY 
        CASE wo.priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'normal' THEN 3 
          ELSE 4 
        END,
        wo.created_at DESC 
        LIMIT ? OFFSET ?`;
      queryParams.push(pageSize, offset);
      
      const list = db.prepare(sql).all(...queryParams).map(item => ({
        ...item,
        status_text: statusTextMap[item.status] || item.status,
        priority_text: getPriorityText(item.priority),
        type_text: typeTextMap[item.order_type] || item.order_type,
      }));
      
      return { list, total, page, pageSize };
    } catch (error) {
      captureError(error, { module: 'WorkOrderService', method: 'getAll' });
      throw error;
    }
  }

  static getById(id) {
    try {
      const db = getDb();
      const order = db.prepare(`
        SELECT wo.*, e.name as equipment_name, e.equipment_code, e.location, e.category,
               mp.plan_name as maintenance_plan_name
        FROM work_orders wo
        LEFT JOIN equipment e ON e.id = wo.equipment_id
        LEFT JOIN maintenance_plans mp ON mp.id = wo.plan_id
        WHERE wo.id = ?
      `).get(id);
      
      if (!order) return null;
      
      const transactions = db.prepare(`
        SELECT it.*, sp.name as part_name, sp.part_code 
        FROM inventory_transactions it
        LEFT JOIN spare_parts sp ON sp.id = it.part_id
        WHERE it.work_order_id = ?
      `).all(id);
      
      return {
        ...order,
        status_text: statusTextMap[order.status] || order.status,
        priority_text: getPriorityText(order.priority),
        type_text: typeTextMap[order.order_type] || order.order_type,
        inventory_transactions: transactions,
      };
    } catch (error) {
      captureError(error, { module: 'WorkOrderService', method: 'getById', id });
      throw error;
    }
  }

  static create(data) {
    try {
      const db = getDb();
      
      const orderNo = data.order_no || generateOrderNo();
      
      const result = db.prepare(`
        INSERT INTO work_orders (order_no, equipment_id, plan_id, title, description,
          order_type, priority, status, assigned_to, scheduled_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderNo,
        data.equipment_id,
        data.plan_id || null,
        data.title,
        data.description,
        data.order_type || 'maintenance',
        data.priority || 'normal',
        data.status || 'pending',
        data.assigned_to || null,
        data.scheduled_date || null
      );

      if (data.status === 'pending' && !data.assigned_to) {
        addJob(config.queues.workOrders, 'auto-assign', {
          orderId: result.lastInsertRowid,
          action: 'auto_assign',
        }, { delay: 5000 });
      }

      if (data.equipment_id && data.order_type === 'maintenance') {
        db.prepare(`
          UPDATE equipment 
          SET status = 'maintenance', updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status = 'running'
        `).run(data.equipment_id);
      }

      captureMessage(`Work order created: ${orderNo}`, 'info', { 
        module: 'WorkOrderService', 
        id: result.lastInsertRowid,
        orderNo 
      });
      
      return this.getById(result.lastInsertRowid);
    } catch (error) {
      captureError(error, { module: 'WorkOrderService', method: 'create' });
      throw error;
    }
  }

  static update(id, data) {
    try {
      const db = getDb();
      
      const fields = [];
      const values = [];
      
      ['title', 'description', 'order_type', 'priority', 'status', 
       'assigned_to', 'scheduled_date', 'completed_date', 
       'spare_parts_used', 'cost'].forEach(field => {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      });
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      db.prepare(`UPDATE work_orders SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      
      const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
      
      if (data.status === 'completed' && order.equipment_id) {
        db.prepare(`
          UPDATE equipment 
          SET status = 'running', updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status = 'maintenance'
        `).run(order.equipment_id);
      }

      captureMessage(`Work order updated: ${id}`, 'info', { module: 'WorkOrderService', id });
      
      return this.getById(id);
    } catch (error) {
      captureError(error, { module: 'WorkOrderService', method: 'update', id });
      throw error;
    }
  }

  static startWork(id, operator) {
    try {
      const db = getDb();
      
      db.prepare(`
        UPDATE work_orders 
        SET status = 'in_progress', assigned_to = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(operator, id);
      
      const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
      
      if (order.equipment_id) {
        db.prepare(`
          UPDATE equipment 
          SET status = 'maintenance', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(order.equipment_id);
      }

      captureMessage(`Work started on order: ${id}`, 'info', { module: 'WorkOrderService', id, operator });
      
      return this.getById(id);
    } catch (error) {
      captureError(error, { module: 'WorkOrderService', method: 'startWork', id });
      throw error;
    }
  }

  static complete(id, data) {
    try {
      const db = getDb();
      
      db.prepare(`
        UPDATE work_orders 
        SET status = 'completed', completed_date = CURRENT_TIMESTAMP,
            spare_parts_used = ?, cost = ?, description = description || ? ,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        data.spare_parts_used || '',
        data.cost || 0,
        data.remark ? `\n处理结果：${data.remark}` : '',
        id
      );
      
      const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
      
      if (order.equipment_id) {
        db.prepare(`
          UPDATE equipment 
          SET status = 'running', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(order.equipment_id);
      }

      addJob(config.queues.healthCheck, 'health-check', { equipmentId: order.equipment_id });

      captureMessage(`Work order completed: ${id}`, 'info', { module: 'WorkOrderService', id });
      
      return this.getById(id);
    } catch (error) {
      captureError(error, { module: 'WorkOrderService', method: 'complete', id });
      throw error;
    }
  }

  static cancel(id, reason) {
    try {
      const db = getDb();
      
      db.prepare(`
        UPDATE work_orders 
        SET status = 'cancelled', description = description || ? ,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(reason ? `\n取消原因：${reason}` : '', id);
      
      const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(id);
      
      if (order.equipment_id) {
        db.prepare(`
          UPDATE equipment 
          SET status = 'running', updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND status = 'maintenance'
        `).run(order.equipment_id);
      }

      captureMessage(`Work order cancelled: ${id}`, 'warning', { module: 'WorkOrderService', id, reason });
      
      return this.getById(id);
    } catch (error) {
      captureError(error, { module: 'WorkOrderService', method: 'cancel', id });
      throw error;
    }
  }

  static delete(id) {
    try {
      const db = getDb();
      db.prepare('DELETE FROM work_orders WHERE id = ?').run(id);
      captureMessage(`Work order deleted: ${id}`, 'info', { module: 'WorkOrderService', id });
      return true;
    } catch (error) {
      captureError(error, { module: 'WorkOrderService', method: 'delete', id });
      throw error;
    }
  }

  static getStats() {
    try {
      const db = getDb();
      
      const byStatus = db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM work_orders 
        GROUP BY status
      `).all().map(s => ({ ...s, status_text: statusTextMap[s.status] || s.status }));
      
      const byPriority = db.prepare(`
        SELECT priority, COUNT(*) as count 
        FROM work_orders 
        GROUP BY priority
      `).all().map(p => ({ ...p, priority_text: getPriorityText(p.priority) }));
      
      const byType = db.prepare(`
        SELECT order_type, COUNT(*) as count 
        FROM work_orders 
        GROUP BY order_type
      `).all().map(t => ({ ...t, type_text: typeTextMap[t.order_type] || t.order_type }));
      
      const totalCost = db.prepare('SELECT SUM(cost) as total FROM work_orders WHERE status = ?').get('completed').total || 0;
      
      const pendingCount = byStatus.find(s => s.status === 'pending')?.count || 0;
      const inProgressCount = byStatus.find(s => s.status === 'in_progress')?.count || 0;
      
      return {
        total_cost: totalCost,
        pending_count: pendingCount,
        in_progress_count: inProgressCount,
        by_status: byStatus,
        by_priority: byPriority,
        by_type: byType,
      };
    } catch (error) {
      captureError(error, { module: 'WorkOrderService', method: 'getStats' });
      throw error;
    }
  }
}

module.exports = WorkOrderService;
