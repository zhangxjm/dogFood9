async function routes(fastify, options) {
  const SystemController = require('../controllers/systemController');

  fastify.get('/info', SystemController.getInfo);
  fastify.get('/health', SystemController.getHealth);
  fastify.get('/queue-stats', SystemController.getQueueStats);
  fastify.get('/logs', SystemController.getLogs);
  fastify.get('/ports', SystemController.getPortList);
  
  fastify.post('/generate-maintenance-plans', SystemController.triggerMaintenanceAutoGenerate);
  fastify.post('/batch-health-check', SystemController.triggerBatchHealthCheck);
}

module.exports = routes;
