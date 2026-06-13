const EquipmentService = require('../services/equipmentService');
const WorkOrderService = require('../services/workOrderService');
const InventoryService = require('../services/inventoryService');
const HealthService = require('../services/healthService');
const { getQueueStats } = require('../queues');
const config = require('../config');
const { successResponse, errorResponse } = require('../utils/helpers');

class DashboardController {
  static async getOverview(request, reply) {
    try {
      const equipmentStats = EquipmentService.getStats();
      const workOrderStats = WorkOrderService.getStats();
      const inventoryStats = InventoryService.getStats();
      const healthReport = HealthService.getHealthReport();
      
      const maintenanceQueueStats = await getQueueStats(config.queues.maintenance);
      const workOrdersQueueStats = await getQueueStats(config.queues.workOrders);
      const healthCheckQueueStats = await getQueueStats(config.queues.healthCheck);
      const inventoryQueueStats = await getQueueStats('inventory-alerts');

      const result = {
        summary: {
          total_equipment: equipmentStats.total,
          total_equipment_value: equipmentStats.total_value,
          avg_health_score: equipmentStats.avg_health_score,
          pending_work_orders: workOrderStats.pending_count,
          in_progress_work_orders: workOrderStats.in_progress_count,
          total_inventory_value: inventoryStats.total_value,
          low_stock_parts: inventoryStats.low_stock_count,
          at_risk_equipment: healthReport.at_risk_equipment.length,
        },
        equipment_stats: equipmentStats,
        work_order_stats: workOrderStats,
        inventory_stats: inventoryStats,
        health_report: healthReport,
        queue_stats: {
          maintenance: maintenanceQueueStats,
          work_orders: workOrdersQueueStats,
          health_check: healthCheckQueueStats,
          inventory_alerts: inventoryQueueStats,
        },
      };

      return reply.send(successResponse(result, '获取仪表板数据成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取仪表板数据失败', 500, error.message));
    }
  }

  static async getRecentActivity(request, reply) {
    try {
      const { getDb } = require('../utils/db');
      const db = getDb();

      const recentWorkOrders = db.prepare(`
        SELECT wo.*, e.name as equipment_name
        FROM work_orders wo
        LEFT JOIN equipment e ON e.id = wo.equipment_id
        ORDER BY wo.created_at DESC
        LIMIT 10
      `).all();

      const recentHealthRecords = db.prepare(`
        SELECT hr.*, e.name as equipment_name
        FROM health_records hr
        LEFT JOIN equipment e ON e.id = hr.equipment_id
        ORDER BY hr.check_date DESC
        LIMIT 10
      `).all();

      const recentTransactions = db.prepare(`
        SELECT it.*, sp.name as part_name, wo.order_no
        FROM inventory_transactions it
        LEFT JOIN spare_parts sp ON sp.id = it.part_id
        LEFT JOIN work_orders wo ON wo.id = it.work_order_id
        ORDER BY it.transaction_date DESC
        LIMIT 10
      `).all();

      const recentLifecycle = db.prepare(`
        SELECT lr.*, e.name as equipment_name
        FROM lifecycle_records lr
        LEFT JOIN equipment e ON e.id = lr.equipment_id
        ORDER BY lr.record_date DESC
        LIMIT 10
      `).all();

      const result = {
        recent_work_orders: recentWorkOrders,
        recent_health_records: recentHealthRecords,
        recent_inventory_transactions: recentTransactions,
        recent_lifecycle_records: recentLifecycle,
      };

      return reply.send(successResponse(result, '获取最近活动成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取最近活动失败', 500, error.message));
    }
  }
}

module.exports = DashboardController;
