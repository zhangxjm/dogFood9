async function routes(fastify, options) {
  const InventoryController = require('../controllers/inventoryController');

  fastify.get('/', InventoryController.getAllParts);
  fastify.get('/stats', InventoryController.getStats);
  fastify.get('/purchase-suggestion', InventoryController.generatePurchaseSuggestion);
  fastify.get('/:id', InventoryController.getPartById);
  fastify.post('/', InventoryController.createPart);
  fastify.put('/:id', InventoryController.updatePart);
  fastify.delete('/:id', InventoryController.deletePart);
  
  fastify.post('/:id/stock', InventoryController.updateStock);
  fastify.post('/smart-dispatch', InventoryController.smartDispatch);
}

module.exports = routes;
