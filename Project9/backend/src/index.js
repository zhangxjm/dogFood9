const fastify = require('fastify')({
  logger: {
    level: 'info',
  },
});
const path = require('path');
const config = require('./config');
const { initSentry, captureError, captureMessage } = require('./utils/monitoring');
const { initDatabase } = require('./utils/initDb');
const { successResponse, errorResponse } = require('./utils/helpers');

async function start() {
  try {
    initSentry();
    
    await initDatabase();

    fastify.register(require('@fastify/cors'), {
      origin: true,
      credentials: true,
    });

    fastify.register(require('@fastify/static'), {
      root: path.join(__dirname, '../../frontend'),
      prefix: '/',
    });

    fastify.register(require('./plugins/responseHandler'));

    fastify.register(require('./routes/equipment'), { prefix: '/api/equipment' });
    fastify.register(require('./routes/maintenance'), { prefix: '/api/maintenance' });
    fastify.register(require('./routes/workOrders'), { prefix: '/api/work-orders' });
    fastify.register(require('./routes/inventory'), { prefix: '/api/inventory' });
    fastify.register(require('./routes/health'), { prefix: '/api/health' });
    fastify.register(require('./routes/dashboard'), { prefix: '/api/dashboard' });
    fastify.register(require('./routes/system'), { prefix: '/api/system' });

    fastify.setNotFoundHandler((request, reply) => {
      if (request.raw.url.startsWith('/api/')) {
        reply.code(404).send(errorResponse('接口不存在', 404));
      } else {
        reply.sendFile('index.html');
      }
    });

    fastify.setErrorHandler((error, request, reply) => {
      captureError(error, {
        url: request.raw.url,
        method: request.raw.method,
        params: request.params,
        query: request.query,
        body: request.body,
      });
      
      reply.code(error.statusCode || 500).send(
        errorResponse(error.message || '服务器内部错误', error.statusCode || 500)
      );
    });

    await require('./queues')();
    captureMessage('Queue workers started successfully', 'info', { module: 'main' });

    const address = await fastify.listen({
      port: config.port,
      host: config.host,
    });

    captureMessage(`Server started successfully`, 'info', {
      module: 'main',
      address,
      port: config.port,
    });

    console.log(`\n========================================`);
    console.log(`  工业设备全生命周期管理系统启动成功!`);
    console.log(`  服务地址: http://localhost:${config.port}`);
    console.log(`  API文档:  http://localhost:${config.port}/api/system/info`);
    console.log(`========================================\n`);

  } catch (error) {
    captureError(error, { module: 'main', phase: 'startup' });
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

start();

process.on('SIGINT', async () => {
  captureMessage('Shutting down server...', 'info', { module: 'main' });
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  captureMessage('Terminating server...', 'info', { module: 'main' });
  await fastify.close();
  process.exit(0);
});
