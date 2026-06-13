const { getDb } = require('../utils/db');
const { captureError, captureMessage } = require('../utils/monitoring');
const { addJob } = require('../queues');
const config = require('../config');

class MaintenanceService {
  static getAllPlans(params = {}) {
    try {
      const db = getDb();
      const { page = 1, pageSize = 20, equipmentId, isActive } = params;
      
      let sql = `
        SELECT mp.*, e.name as equipment_name, e.equipment_code, e.location 
        FROM maintenance_plans mp
        LEFT JOIN equipment e ON e.id = mp.equipment_id
        WHERE 1=1
      `;
      const queryParams = [];
      
      if (equipmentId) {
        sql += ' AND mp.equipment_id = ?';
        queryParams.push(equipmentId);
      }
      if (isActive !== undefined) {
        sql += ' AND mp.is_active = ?';
        queryParams.push(isActive ? 1 : 0);
      }
      
      const total = db.prepare(`SELECT COUNT(*) as count FROM (${sql})`).get(...queryParams).count;
      
      const offset = (page - 1) * pageSize;
      sql += ' ORDER BY mp.created_at DESC LIMIT ? OFFSET ?';
      queryParams.push(pageSize, offset);
      
      const list = db.prepare(sql).all(...queryParams);
      
      return { list, total, page, pageSize };
    } catch (error) {
      captureError(error, { module: 'MaintenanceService', method: 'getAllPlans' });
      throw error;
    }
  }

  static getPlanById(id) {
    try {
      const db = getDb();
      const plan = db.prepare(`
        SELECT mp.*, e.name as equipment_name, e.equipment_code 
        FROM maintenance_plans mp
        LEFT JOIN equipment e ON e.id = mp.equipment_id
        WHERE mp.id = ?
      `).get(id);
      
      if (!plan) return null;
      
      const workOrders = db.prepare(`
        SELECT * FROM work_orders 
        WHERE plan_id = ? 
        ORDER BY created_at DESC
      `).all(id);
      
      return { ...plan, work_orders: workOrders };
    } catch (error) {
      captureError(error, { module: 'MaintenanceService', method: 'getPlanById', id });
      throw error;
    }
  }

  static createPlan(data) {
    try {
      const db = getDb();
      
      const result = db.prepare(`
        INSERT INTO maintenance_plans (equipment_id, plan_name, plan_type, frequency,
          interval_days, next_maintenance_date, description, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.equipment_id,
        data.plan_name,
        data.plan_type,
        data.frequency,
        data.interval_days,
        data.next_maintenance_date,
        data.description,
        data.is_active !== undefined ? data.is_active : 1
      );

      addJob(config.queues.maintenance, 'generate-work-order', {
        planId: result.lastInsertRowid,
        equipmentId: data.equipment_id,
      }, {
        delay: new Date(data.next_maintenance_date).getTime() - Date.now(),
      });

      captureMessage(`Maintenance plan created: ${data.plan_name}`, 'info', { 
        module: 'MaintenanceService', 
        id: result.lastInsertRowid 
      });
      
      return this.getPlanById(result.lastInsertRowid);
    } catch (error) {
      captureError(error, { module: 'MaintenanceService', method: 'createPlan' });
      throw error;
    }
  }

  static updatePlan(id, data) {
    try {
      const db = getDb();
      
      const fields = [];
      const values = [];
      
      ['plan_name', 'plan_type', 'frequency', 'interval_days', 
       'next_maintenance_date', 'description', 'is_active'].forEach(field => {
        if (data[field] !== undefined) {
          fields.push(`${field} = ?`);
          values.push(data[field]);
        }
      });
      
      values.push(id);
      
      db.prepare(`UPDATE maintenance_plans SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      
      captureMessage(`Maintenance plan updated: ${id}`, 'info', { module: 'MaintenanceService', id });
      
      return this.getPlanById(id);
    } catch (error) {
      captureError(error, { module: 'MaintenanceService', method: 'updatePlan', id });
      throw error;
    }
  }

  static deletePlan(id) {
    try {
      const db = getDb();
      db.prepare('DELETE FROM maintenance_plans WHERE id = ?').run(id);
      captureMessage(`Maintenance plan deleted: ${id}`, 'info', { module: 'MaintenanceService', id });
      return true;
    } catch (error) {
      captureError(error, { module: 'MaintenanceService', method: 'deletePlan', id });
      throw error;
    }
  }

  static triggerMaintenance(id) {
    try {
      const db = getDb();
      const plan = db.prepare('SELECT * FROM maintenance_plans WHERE id = ?').get(id);
      
      if (!plan) {
        throw new Error('维保计划不存在');
      }

      addJob(config.queues.maintenance, 'generate-work-order', {
        planId: id,
        equipmentId: plan.equipment_id,
      });

      captureMessage(`Maintenance triggered for plan: ${id}`, 'info', { module: 'MaintenanceService', id });
      
      return { success: true, message: '维保计划已触发，工单即将生成' };
    } catch (error) {
      captureError(error, { module: 'MaintenanceService', method: 'triggerMaintenance', id });
      throw error;
    }
  }

  static generateAutoPlans() {
    try {
      const db = getDb();
      const equipmentList = db.prepare(`
        SELECT * FROM equipment 
        WHERE status IN ('running', 'installed', 'maintenance')
      `).all();

      const createdPlans = [];

      for (const equip of equipmentList) {
        const existingPlans = db.prepare(
          'SELECT COUNT(*) as count FROM maintenance_plans WHERE equipment_id = ?'
        ).get(equip.id).count;

        if (existingPlans > 0) continue;

        const nextMonth = new Date();
        nextMonth.setDate(nextMonth.getDate() + 1);

        const dailyPlan = this.createPlan({
          equipment_id: equip.id,
          plan_name: `${equip.name} - 日常点检`,
          plan_type: 'routine',
          frequency: 'daily',
          interval_days: 1,
          next_maintenance_date: nextMonth.toISOString().split('T')[0],
          description: '每日班前检查、清洁、润滑、紧固',
          is_active: 1,
        });
        createdPlans.push(dailyPlan);

        nextMonth.setDate(nextMonth.getDate() + 30);
        const monthlyPlan = this.createPlan({
          equipment_id: equip.id,
          plan_name: `${equip.name} - 月度保养`,
          plan_type: 'routine',
          frequency: 'monthly',
          interval_days: 30,
          next_maintenance_date: nextMonth.toISOString().split('T')[0],
          description: '月度全面检查、易损件检查、精度校准',
          is_active: 1,
        });
        createdPlans.push(monthlyPlan);

        nextMonth.setDate(nextMonth.getDate() + 60);
        const quarterlyPlan = this.createPlan({
          equipment_id: equip.id,
          plan_name: `${equip.name} - 季度大修`,
          plan_type: 'major',
          frequency: 'quarterly',
          interval_days: 90,
          next_maintenance_date: nextMonth.toISOString().split('T')[0],
          description: '季度全面检修、润滑油更换、密封件检查',
          is_active: 1,
        });
        createdPlans.push(quarterlyPlan);
      }

      captureMessage(`Auto-generated ${createdPlans.length} maintenance plans`, 'info', { 
        module: 'MaintenanceService' 
      });

      return { created: createdPlans.length, plans: createdPlans };
    } catch (error) {
      captureError(error, { module: 'MaintenanceService', method: 'generateAutoPlans' });
      throw error;
    }
  }
}

module.exports = MaintenanceService;
