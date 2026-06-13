async function routes(fastify, options) {
  const EquipmentController = require('../controllers/equipmentController');

  fastify.get('/', EquipmentController.getAll);
  fastify.get('/stats', EquipmentController.getStats);
  fastify.get('/:id', EquipmentController.getById);
  fastify.post('/', EquipmentController.create);
  fastify.put('/:id', EquipmentController.update);
  fastify.delete('/:id', EquipmentController.delete);
  
  fastify.post('/:id/install', EquipmentController.install);
  fastify.post('/:id/start', EquipmentController.startOperation);
  fastify.post('/:id/scrap', EquipmentController.scrap);
}

module.exports = routes;
