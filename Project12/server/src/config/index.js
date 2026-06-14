require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  dbPath: process.env.DB_PATH || './data/live_monitor.db',
  dataSimulationInterval: parseInt(process.env.DATA_SIMULATION_INTERVAL || '1000'),
  maxHistoryHours: parseInt(process.env.MAX_HISTORY_HOURS || '24'),
};
