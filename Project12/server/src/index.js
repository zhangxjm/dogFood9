const express = require('express');
const http = require('http');
const cors = require('cors');
const config = require('./config');
const { initRedis } = require('./cache/redis');
const { initWebSocket, broadcastMetrics } = require('./services/websocket');
const { initSimulation, generateAllMetrics } = require('./services/dataSimulator');
const { LiveRoom } = require('./models');
const apiRoutes = require('./routes/api');
const { initDatabase } = require('./database');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    wsClients: require('./services/websocket').getClientCount?.() || 0,
  });
});

function startDataCollection() {
  console.log('Starting data collection...');
  
  setInterval(() => {
    try {
      const metrics = generateAllMetrics();
      
      if (metrics.length > 0) {
        const rooms = LiveRoom.getAll();
        const roomMap = {};
        rooms.forEach(r => {
          roomMap[r.id] = r;
        });
        
        const metricsWithInfo = metrics.map(m => ({
          ...m,
          room_title: roomMap[m.room_id]?.title || '',
          streamer_name: roomMap[m.room_id]?.streamer_name || '',
          platform: roomMap[m.room_id]?.platform_name || '',
          platform_name: roomMap[m.room_id]?.platform_display_name || '',
        }));
        
        broadcastMetrics(metricsWithInfo);
      }
    } catch (err) {
      console.error('Error in data collection cycle:', err);
    }
  }, config.dataSimulationInterval);
  
  console.log(`Data collection started with ${config.dataSimulationInterval}ms interval`);
}

async function startServer() {
  try {
    console.log('Initializing services...');
    
    await initDatabase();
    
    await initRedis();
    
    initWebSocket(server);
    
    initSimulation();
    
    startDataCollection();
    
    server.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
      console.log(`Health check: http://localhost:${config.port}/health`);
      console.log(`WebSocket: ws://localhost:${config.port}/ws`);
    });
    
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
