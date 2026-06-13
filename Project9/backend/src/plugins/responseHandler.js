const fp = require('fastify-plugin');
const { successResponse, errorResponse } = require('../utils/helpers');

module.exports = fp(async function (fastify, opts) {
  fastify.decorate('sendSuccess', function (reply, data, message) {
    return reply.send(successResponse(data, message));
  });

  fastify.decorate('sendError', function (reply, message, code, details) {
    return reply.code(code || 500).send(errorResponse(message, code, details));
  });

  fastify.addHook('onRequest', async (request, reply) => {
    request.startTime = Date.now();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const duration = Date.now() - request.startTime;
    const url = request.raw.url;
    
    if (url.startsWith('/api/')) {
      console.log(`[${reply.statusCode}] ${request.raw.method} ${url} - ${duration}ms`);
    }
  });
});
