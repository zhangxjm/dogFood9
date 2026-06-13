async function routes(fastify, options) {
  const MaintenanceController = require('../controllers/maintenanceController');

  fastify.get('/', MaintenanceController.getAllPlans);
  fastify.get('/generate-auto', MaintenanceController.generateAutoPlans);
  fastify.get('/:id', MaintenanceController.getPlanById);
  fastify.post('/', MaintenanceController.createPlan);
  fastify.put('/:id', MaintenanceController.updatePlan);
  fastify.delete('/:id', MaintenanceController.deletePlan);
  fastify.post('/:id/trigger', MaintenanceController.triggerMaintenance);
}

module.exports = routes;
