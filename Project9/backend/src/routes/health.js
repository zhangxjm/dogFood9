async function routes(fastify, options) {
  const HealthController = require('../controllers/healthController');

  fastify.get('/', HealthController.getAllRecords);
  fastify.get('/report', HealthController.getHealthReport);
  fastify.get('/batch-check', HealthController.batchHealthCheck);
  fastify.get('/:id', HealthController.getEquipmentHealth);
  fastify.post('/:id/record', HealthController.addRecord);
  fastify.post('/:id/check', HealthController.triggerHealthCheck);
}

module.exports = routes;
