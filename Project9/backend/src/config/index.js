require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  env: process.env.NODE_ENV || 'development',
  
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  
  sentry: {
    dsn: process.env.SENTRY_DSN || '',
    enabled: process.env.SENTRY_ENABLED === 'true',
  },
  
  db: {
    path: process.env.DB_PATH || './data/equipment.db',
  },
  
  queues: {
    maintenance: 'maintenance-plans',
    workOrders: 'work-orders',
    healthCheck: 'health-check',
  },
};
