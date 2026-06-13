const { Queue, Worker, QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');
const config = require('../config');
const { captureError, captureMessage } = require('../utils/monitoring');
const { generateOrderNo } = require('../utils/helpers');
const { getDb } = require('../utils/db');

let connection = null;
let queues = {};
let workers = [];

function getRedisConnection() {
  if (!connection) {
    connection = new IORedis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 10000,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    connection.on('connect', () => {
      captureMessage('Redis connected successfully', 'info', { module: 'queue' });
    });

    connection.on('error', (error) => {
      captureError(error, { module: 'queue', phase: 'redis-connection' });
    });
  }
  return connection;
}

function createQueue(name) {
  if (!queues[name]) {
    queues[name] = new Queue(name, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });
    captureMessage(`Queue created: ${name}`, 'info', { module: 'queue' });
  }
  return queues[name];
}

function recordJob(job, status, result = null, error = null) {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM queue_jobs WHERE job_id = ?').get(job.id);
    
    if (!existing) {
      db.prepare(`
        INSERT INTO queue_jobs (job_id, queue_name, job_type, status, payload, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(job.id, job.queueName, job.name, 'pending', JSON.stringify(job.data), new Date().toISOString());
    }

    const updateData = { status };
    if (result) updateData.result = JSON.stringify(result);
    if (error) updateData.error = JSON.stringify(error);
    
    const fields = Object.keys(updateData).map(f => `${f} = ?`).join(', ');
    const values = Object.values(updateData);
    
    if (status === 'active') {
      db.prepare(`UPDATE queue_jobs SET ${fields}, started_at = ? WHERE job_id = ?`)
        .run(...values, new Date().toISOString(), job.id);
    } else if (status === 'completed' || status === 'failed') {
      db.prepare(`UPDATE queue_jobs SET ${fields}, completed_at = ? WHERE job_id = ?`)
        .run(...values, new Date().toISOString(), job.id);
    } else {
      db.prepare(`UPDATE queue_jobs SET ${fields} WHERE job_id = ?`)
        .run(...values, job.id);
    }
  } catch (dbError) {
    captureError(dbError, { module: 'queue', jobId: job.id });
  }
}

async function processMaintenancePlan(job) {
  const { planId, equipmentId } = job.data;
  captureMessage(`Processing maintenance plan: ${planId}`, 'info', { module: 'queue', job: job.id });

  try {
    const db = getDb();
    
    const plan = db.prepare(`
      SELECT mp.*, e.name as equipment_name, e.location 
      FROM maintenance_plans mp
      JOIN equipment e ON e.id = mp.equipment_id
      WHERE mp.id = ? AND mp.is_active = 1
    `).get(planId);

    if (!plan) {
      throw new Error(`Maintenance plan ${planId} not found or inactive`);
    }

    const orderNo = generateOrderNo();
    const result = db.prepare(`
      INSERT INTO work_orders (order_no, equipment_id, plan_id, title, description, 
        order_type, priority, status, assigned_to, scheduled_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderNo,
      plan.equipment_id,
      plan.id,
      `${plan.equipment_name} - ${plan.plan_name}`,
      plan.description || '自动生成的维保工单',
      'maintenance',
      plan.plan_type === 'major' ? 'high' : 'normal',
      'pending',
      null,
      plan.next_maintenance_date
    );

    const nextDate = new Date(plan.next_maintenance_date);
    nextDate.setDate(nextDate.getDate() + plan.interval_days);
    
    db.prepare(`
      UPDATE maintenance_plans 
      SET last_maintenance_date = next_maintenance_date,
          next_maintenance_date = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(nextDate.toISOString().split('T')[0], planId);

    captureMessage(`Work order generated: ${orderNo} for plan ${planId}`, 'info', {
      module: 'queue',
      orderNo,
      planId,
    });

    return {
      success: true,
      workOrderId: result.lastInsertRowid,
      orderNo,
      nextMaintenanceDate: nextDate.toISOString().split('T')[0],
    };
  } catch (error) {
    captureError(error, { module: 'queue', job: 'processMaintenancePlan', planId });
    throw error;
  }
}

async function processWorkOrder(job) {
  const { orderId, action } = job.data;
  captureMessage(`Processing work order: ${orderId}, action: ${action}`, 'info', { module: 'queue' });

  try {
    const db = getDb();
    
    if (action === 'auto_assign') {
      const workersList = ['张师傅', '李师傅', '王师傅', '赵师傅', '孙师傅'];
      const assignedTo = workersList[Math.floor(Math.random() * workersList.length)];
      
      db.prepare(`
        UPDATE work_orders 
        SET assigned_to = ?, status = 'assigned', updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'pending'
      `).run(assignedTo, orderId);

      captureMessage(`Work order ${orderId} auto-assigned to ${assignedTo}`, 'info', { module: 'queue' });
      return { success: true, assignedTo };
    }

    if (action === 'notify_overdue') {
      const order = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(orderId);
      if (order && new Date(order.scheduled_date) < new Date() && order.status !== 'completed') {
        captureMessage(`Work order ${order.order_no} is overdue`, 'warning', { module: 'queue', orderId });
        return { success: true, overdue: true, orderNo: order.order_no };
      }
      return { success: true, overdue: false };
    }

    return { success: true, action };
  } catch (error) {
    captureError(error, { module: 'queue', job: 'processWorkOrder', orderId, action });
    throw error;
  }
}

async function processHealthCheck(job) {
  const { equipmentId } = job.data;
  captureMessage(`Processing health check for equipment: ${equipmentId}`, 'info', { module: 'queue' });

  try {
    const db = getDb();
    const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(equipmentId);
    
    if (!equipment) {
      throw new Error(`Equipment ${equipmentId} not found`);
    }

    const baseTemp = 30 + Math.random() * 30;
    const baseVibration = 1 + Math.random() * 4;
    const basePressure = 0.4 + Math.random() * 0.4;
    const basePower = 10 + Math.random() * 35;
    const runningHours = (equipment.running_hours || 0) + 8;

    const errorCodes = [];
    if (baseVibration > 4) errorCodes.push('E-001');
    if (baseTemp > 65) errorCodes.push('E-002');
    if (basePressure > 0.8) errorCodes.push('E-003');

    const healthScore = Math.max(0, Math.min(100, Math.round(
      100 - 
      (baseTemp > 60 ? (baseTemp - 60) * 2 : 0) -
      (baseVibration > 3 ? (baseVibration - 3) * 10 : 0) -
      (basePressure > 0.7 ? (basePressure - 0.7) * 50 : 0) -
      errorCodes.length * 10
    )));

    let assessment = '运行状态良好';
    let recommendations = '继续按计划保养';
    
    if (healthScore < 60) {
      assessment = '设备状态异常，需要关注';
      recommendations = '建议尽快安排检修，检查关键部件';
    } else if (healthScore < 75) {
      assessment = '设备状态一般';
      recommendations = '建议增加点检频率，关注运行参数';
    }

    db.prepare(`
      INSERT INTO health_records (equipment_id, running_hours, temperature, vibration, 
        pressure, power_consumption, error_codes, health_score, assessment, recommendations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      equipmentId,
      runningHours,
      Math.round(baseTemp * 10) / 10,
      Math.round(baseVibration * 10) / 10,
      Math.round(basePressure * 100) / 100,
      Math.round(basePower * 10) / 10,
      errorCodes.join(','),
      healthScore,
      assessment,
      recommendations
    );

    db.prepare(`
      UPDATE equipment 
      SET health_score = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(healthScore, equipmentId);

    if (healthScore < 60 && equipment.status === 'running') {
      const orderNo = generateOrderNo();
      db.prepare(`
        INSERT INTO work_orders (order_no, equipment_id, title, description, 
          order_type, priority, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderNo,
        equipmentId,
        `${equipment.name} - 健康度异常检修`,
        `设备健康度降至 ${healthScore}%，${assessment}`,
        'repair',
        'high',
        'pending'
      );
      captureMessage(`Alert work order created for equipment ${equipmentId}`, 'warning', { module: 'queue' });
    }

    return {
      success: true,
      healthScore,
      equipmentId,
      equipmentName: equipment.name,
    };
  } catch (error) {
    captureError(error, { module: 'queue', job: 'processHealthCheck', equipmentId });
    throw error;
  }
}

async function processInventoryAlert(job) {
  const { partId } = job.data;
  captureMessage(`Processing inventory alert for part: ${partId}`, 'info', { module: 'queue' });

  try {
    const db = getDb();
    const part = db.prepare('SELECT * FROM spare_parts WHERE id = ?').get(partId);
    
    if (!part) {
      throw new Error(`Spare part ${partId} not found`);
    }

    if (part.quantity < part.min_stock) {
      const suggestedQuantity = part.max_stock - part.quantity;
      captureMessage(`Low inventory alert for part ${part.part_code}`, 'warning', {
        module: 'queue',
        partId,
        current: part.quantity,
        min: part.min_stock,
        suggested: suggestedQuantity,
      });

      return {
        success: true,
        alert: true,
        partCode: part.part_code,
        partName: part.name,
        currentQuantity: part.quantity,
        minStock: part.min_stock,
        suggestedPurchase: suggestedQuantity,
      };
    }

    return { success: true, alert: false };
  } catch (error) {
    captureError(error, { module: 'queue', job: 'processInventoryAlert', partId });
    throw error;
  }
}

async function initQueues() {
  try {
    const connection = getRedisConnection();
    
    const maintenanceQueue = createQueue(config.queues.maintenance);
    const workOrdersQueue = createQueue(config.queues.workOrders);
    const healthCheckQueue = createQueue(config.queues.healthCheck);
    const inventoryAlertQueue = createQueue('inventory-alerts');

    const maintenanceWorker = new Worker(config.queues.maintenance, async (job) => {
      recordJob(job, 'active');
      try {
        const result = await processMaintenancePlan(job);
        recordJob(job, 'completed', result);
        return result;
      } catch (error) {
        recordJob(job, 'failed', null, error);
        throw error;
      }
    }, { connection });

    const workOrderWorker = new Worker(config.queues.workOrders, async (job) => {
      recordJob(job, 'active');
      try {
        const result = await processWorkOrder(job);
        recordJob(job, 'completed', result);
        return result;
      } catch (error) {
        recordJob(job, 'failed', null, error);
        throw error;
      }
    }, { connection });

    const healthCheckWorker = new Worker(config.queues.healthCheck, async (job) => {
      recordJob(job, 'active');
      try {
        const result = await processHealthCheck(job);
        recordJob(job, 'completed', result);
        return result;
      } catch (error) {
        recordJob(job, 'failed', null, error);
        throw error;
      }
    }, { connection });

    const inventoryAlertWorker = new Worker('inventory-alerts', async (job) => {
      recordJob(job, 'active');
      try {
        const result = await processInventoryAlert(job);
        recordJob(job, 'completed', result);
        return result;
      } catch (error) {
        recordJob(job, 'failed', null, error);
        throw error;
      }
    }, { connection });

    workers.push(maintenanceWorker, workOrderWorker, healthCheckWorker, inventoryAlertWorker);

    workers.forEach(worker => {
      worker.on('completed', (job) => {
        captureMessage(`Job completed: ${job.name} [${job.id}]`, 'info', { module: 'queue' });
      });

      worker.on('failed', (job, error) => {
        captureError(error, { module: 'queue', jobName: job?.name, jobId: job?.id });
      });
    });

    await scheduleRecurringJobs();

    captureMessage('All queues and workers initialized successfully', 'info', { module: 'queue' });

    return {
      queues: {
        maintenance: maintenanceQueue,
        workOrders: workOrdersQueue,
        healthCheck: healthCheckQueue,
        inventoryAlerts: inventoryAlertQueue,
      },
      workers,
    };
  } catch (error) {
    captureError(error, { module: 'queue', phase: 'initialization' });
    throw error;
  }
}

async function scheduleRecurringJobs() {
  try {
    const db = getDb();
    
    const plans = db.prepare('SELECT * FROM maintenance_plans WHERE is_active = 1').all();
    const equipmentList = db.prepare('SELECT id FROM equipment WHERE status NOT IN (?, ?)', ['scrapped', 'purchased']).all();
    const parts = db.prepare('SELECT id FROM spare_parts').all();

    const maintenanceQueue = createQueue(config.queues.maintenance);
    const healthCheckQueue = createQueue(config.queues.healthCheck);
    const inventoryAlertQueue = createQueue('inventory-alerts');

    for (const plan of plans) {
      await maintenanceQueue.add(
        'generate-work-order',
        { planId: plan.id, equipmentId: plan.equipment_id },
        {
          repeat: {
            every: plan.interval_days * 24 * 60 * 60 * 1000,
          },
          jobId: `plan-${plan.id}`,
        }
      );
    }

    for (const equip of equipmentList) {
      await healthCheckQueue.add(
        'health-check',
        { equipmentId: equip.id },
        {
          repeat: {
            every: 24 * 60 * 60 * 1000,
          },
          jobId: `health-${equip.id}`,
        }
      );
    }

    for (const part of parts) {
      await inventoryAlertQueue.add(
        'inventory-alert',
        { partId: part.id },
        {
          repeat: {
            every: 6 * 60 * 60 * 1000,
          },
          jobId: `inventory-${part.id}`,
        }
      );
    }

    captureMessage('Recurring jobs scheduled successfully', 'info', {
      module: 'queue',
      plans: plans.length,
      equipment: equipmentList.length,
      parts: parts.length,
    });
  } catch (error) {
    captureError(error, { module: 'queue', phase: 'schedule-recurring' });
  }
}

async function addJob(queueName, jobName, data, options = {}) {
  const queue = createQueue(queueName);
  const job = await queue.add(jobName, data, options);
  captureMessage(`Job added to queue: ${queueName} - ${jobName}`, 'info', {
    module: 'queue',
    jobId: job.id,
  });
  return job;
}

async function getQueueStats(queueName) {
  const queue = createQueue(queueName);
  return await queue.getJobCounts();
}

module.exports = initQueues;
module.exports.createQueue = createQueue;
module.exports.addJob = addJob;
module.exports.getQueueStats = getQueueStats;
module.exports.getRedisConnection = getRedisConnection;
