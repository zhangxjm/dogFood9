async function routes(fastify, options) {
  const DashboardController = require('../controllers/dashboardController');

  fastify.get('/', DashboardController.getOverview);
  fastify.get('/activity', DashboardController.getRecentActivity);
}

module.exports = routes;
