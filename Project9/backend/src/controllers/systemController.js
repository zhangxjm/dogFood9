const { successResponse, errorResponse } = require('../utils/helpers');
const { getDb } = require('../utils/db');
const { getQueueStats } = require('../queues');
const config = require('../config');
const os = require('os');

class SystemController {
  static async getInfo(request, reply) {
    try {
      const info = {
        name: '工业设备全生命周期管理系统',
        version: '1.0.0',
        description: '覆盖设备采购、安装、运维、报废全流程的数字化管理系统',
        features: [
          '设备全生命周期管理',
          '维保计划自动生成',
          '备件库存智能调度',
          '设备健康度 AI 评估',
          '消息队列处理运维工单',
          'Sentry 错误监控集成',
        ],
        tech_stack: {
          backend: 'Node.js + Fastify',
          database: 'SQLite',
          queue: 'BullMQ + Redis',
          monitoring: 'Sentry',
        },
        endpoints: {
          equipment: '/api/equipment',
          maintenance: '/api/maintenance',
          work_orders: '/api/work-orders',
          inventory: '/api/inventory',
          health: '/api/health',
          dashboard: '/api/dashboard',
          system: '/api/system',
        },
        server_time: new Date().toISOString(),
        uptime: process.uptime(),
      };

      return reply.send(successResponse(info, '获取系统信息成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取系统信息失败', 500, error.message));
    }
  }

  static async getHealth(request, reply) {
    try {
      const db = getDb();
      const dbCheck = db.prepare('SELECT 1 as ok').get();

      let redisStatus = 'disconnected';
      try {
        const { getRedisConnection } = require('../queues');
        const redis = getRedisConnection();
        if (redis.status === 'ready' || redis.status === 'connect') {
          redisStatus = 'connected';
        }
      } catch (e) {
        redisStatus = 'disconnected';
      }

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: dbCheck.ok === 1 ? 'healthy' : 'unhealthy',
          redis: redisStatus === 'connected' ? 'healthy' : 'degraded',
          api: 'healthy',
        },
        system: {
          platform: os.platform(),
          arch: os.arch(),
          cpus: os.cpus().length,
          total_memory: os.totalmem(),
          free_memory: os.freemem(),
          load_avg: os.loadavg(),
        },
      };

      const allHealthy = Object.values(health.services).every(s => s === 'healthy');
      health.status = allHealthy ? 'healthy' : 'degraded';

      return reply.send(successResponse(health, '系统健康检查完成'));
    } catch (error) {
      return reply.code(503).send(errorResponse('系统健康检查失败', 503, error.message));
    }
  }

  static async getQueueStats(request, reply) {
    try {
      const result = {
        maintenance: await getQueueStats(config.queues.maintenance),
        work_orders: await getQueueStats(config.queues.workOrders),
        health_check: await getQueueStats(config.queues.healthCheck),
        inventory_alerts: await getQueueStats('inventory-alerts'),
      };

      return reply.send(successResponse(result, '获取队列统计成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取队列统计失败', 500, error.message));
    }
  }

  static async getLogs(request, reply) {
    try {
      const db = getDb();
      const { page = 1, pageSize = 50, level } = request.query;

      let sql = 'SELECT * FROM system_logs WHERE 1=1';
      const params = [];

      if (level) {
        sql += ' AND log_level = ?';
        params.push(level);
      }

      const total = db.prepare(`SELECT COUNT(*) as count FROM (${sql})`).get(...params).count;

      const offset = (page - 1) * pageSize;
      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(pageSize, offset);

      const logs = db.prepare(sql).all(...params);

      return reply.send(successResponse({ list: logs, total, page, pageSize }, '获取系统日志成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取系统日志失败', 500, error.message));
    }
  }

  static async getPortList(request, reply) {
    try {
      const ports = {
        http_server: parseInt(process.env.PORT) || 3000,
        redis: parseInt(process.env.REDIS_PORT) || 6379,
        description: {
          http_server: 'Fastify HTTP 服务，提供 Web 界面和 REST API',
          redis: 'Redis 服务，用于 BullMQ 消息队列存储',
        },
      };

      return reply.send(successResponse(ports, '获取端口列表成功'));
    } catch (error) {
      return reply.code(500).send(errorResponse('获取端口列表失败', 500, error.message));
    }
  }

  static async triggerMaintenanceAutoGenerate(request, reply) {
    try {
      const MaintenanceService = require('../services/maintenanceService');
      const result = MaintenanceService.generateAutoPlans();
      return reply.send(successResponse(result, `已自动生成 ${result.created} 条维保计划`));
    } catch (error) {
      return reply.code(500).send(errorResponse('自动生成维保计划失败', 500, error.message));
    }
  }

  static async triggerBatchHealthCheck(request, reply) {
    try {
      const HealthService = require('../services/healthService');
      const result = HealthService.batchHealthCheck();
      return reply.send(successResponse(result, result.message));
    } catch (error) {
      return reply.code(500).send(errorResponse('批量健康检查失败', 500, error.message));
    }
  }
}

module.exports = SystemController;
