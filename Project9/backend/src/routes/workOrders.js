async function routes(fastify, options) {
  const WorkOrderController = require('../controllers/workOrderController');

  fastify.get('/', WorkOrderController.getAll);
  fastify.get('/stats', WorkOrderController.getStats);
  fastify.get('/:id', WorkOrderController.getById);
  fastify.post('/', WorkOrderController.create);
  fastify.put('/:id', WorkOrderController.update);
  fastify.delete('/:id', WorkOrderController.delete);
  
  fastify.post('/:id/start', WorkOrderController.startWork);
  fastify.post('/:id/complete', WorkOrderController.complete);
  fastify.post('/:id/cancel', WorkOrderController.cancel);
}

module.exports = routes;
