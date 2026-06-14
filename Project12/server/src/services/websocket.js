const WebSocket = require('ws');
const { getCache, setCache } = require('../cache/redis');

let wss = null;
let clients = new Set();

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    clients.add(ws);

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        handleClientMessage(ws, data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err.message);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err.message);
      clients.delete(ws);
    });
  });

  console.log('WebSocket server initialized');
  return wss;
}

function handleClientMessage(ws, data) {
  switch (data.type) {
    case 'subscribe':
      ws.subscribedRooms = ws.subscribedRooms || new Set();
      if (data.roomIds) {
        data.roomIds.forEach(id => ws.subscribedRooms.add(id));
      }
      sendMessage(ws, { type: 'subscribed', roomIds: data.roomIds });
      break;
    case 'unsubscribe':
      if (ws.subscribedRooms && data.roomIds) {
        data.roomIds.forEach(id => ws.subscribedRooms.delete(id));
      }
      sendMessage(ws, { type: 'unsubscribed', roomIds: data.roomIds });
      break;
    default:
      break;
  }
}

function sendMessage(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcast(message) {
  const msgStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msgStr);
    }
  });
}

function broadcastToRoom(roomId, message) {
  const msgStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && 
        client.subscribedRooms && 
        client.subscribedRooms.has(roomId)) {
      client.send(msgStr);
    }
  });
}

async function broadcastMetrics(metricsWithRoomInfo) {
  const message = {
    type: 'metrics_update',
    timestamp: new Date().toISOString(),
    data: metricsWithRoomInfo,
  };
  
  broadcast(message);
  
  await setCache('latest_metrics', metricsWithRoomInfo, 5);
}

async function broadcastRoomUpdate(roomId, data) {
  const message = {
    type: 'room_update',
    room_id: roomId,
    timestamp: new Date().toISOString(),
    data,
  };
  
  broadcastToRoom(roomId, message);
  broadcast(message);
}

function getClientCount() {
  return clients.size;
}

module.exports = {
  initWebSocket,
  broadcastMetrics,
  broadcastRoomUpdate,
  getClientCount,
};
