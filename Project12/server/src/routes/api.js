const express = require('express');
const { Platform, LiveRoom, LiveMetric, Product } = require('../models');
const { getCache, setCache } = require('../cache/redis');

const router = express.Router();

router.get('/platforms', async (req, res) => {
  try {
    const cacheKey = 'platforms';
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.json({ success: true, data: cached });
    }
    
    const platforms = Platform.getAll();
    await setCache(cacheKey, platforms, 300);
    
    res.json({ success: true, data: platforms });
  } catch (err) {
    console.error('Error fetching platforms:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/rooms', async (req, res) => {
  try {
    const { platform } = req.query;
    const cacheKey = platform ? `rooms:${platform}` : 'rooms:all';
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.json({ success: true, data: cached });
    }
    
    let rooms;
    if (platform) {
      const platformData = Platform.getByName(platform);
      if (!platformData) {
        return res.status(404).json({ success: false, message: 'Platform not found' });
      }
      rooms = LiveRoom.getByPlatform(platformData.id);
    } else {
      rooms = LiveRoom.getAll();
    }
    
    await setCache(cacheKey, rooms, 60);
    
    res.json({ success: true, data: rooms });
  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/rooms/:id', async (req, res) => {
  try {
    const room = LiveRoom.getById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    
    res.json({ success: true, data: room });
  } catch (err) {
    console.error('Error fetching room:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/metrics/latest', async (req, res) => {
  try {
    const cacheKey = 'metrics:latest';
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.json({ success: true, data: cached });
    }
    
    const metrics = LiveMetric.getRealTimeAllRooms();
    await setCache(cacheKey, metrics, 2);
    
    res.json({ success: true, data: metrics });
  } catch (err) {
    console.error('Error fetching latest metrics:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/metrics/room/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { start, end, granularity } = req.query;
    
    let data;
    if (granularity) {
      data = LiveMetric.getAggregatedByRoom(roomId, start, end, granularity);
    } else {
      data = LiveMetric.getHistoryByRoom(roomId, start, end);
    }
    
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching room metrics:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/overview/platform/:platformId', async (req, res) => {
  try {
    const { platformId } = req.params;
    const { start, end } = req.query;
    
    const data = LiveMetric.getPlatformOverview(platformId, start, end);
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching platform overview:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/products/room/:roomId', async (req, res) => {
  try {
    const products = Product.getByRoom(req.params.roomId);
    res.json({ success: true, data: products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/products/top', async (req, res) => {
  try {
    const { limit = 10, start, end } = req.query;
    const products = Product.getTopProducts(parseInt(limit), start, end);
    res.json({ success: true, data: products });
  } catch (err) {
    console.error('Error fetching top products:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/report/custom', async (req, res) => {
  try {
    const { type, platformId, roomIds, start, end, dimensions } = req.query;
    
    let data = {};
    
    if (roomIds) {
      const roomIdList = roomIds.split(',').map(Number);
      data.rooms = roomIdList.map(roomId => {
        const room = LiveRoom.getById(roomId);
        const metrics = LiveMetric.getAggregatedByRoom(roomId, start, end, 'hour');
        const products = Product.getByRoom(roomId);
        
        return {
          room,
          metrics,
          products,
        };
      });
    }
    
    data.summary = calculateSummary(data.rooms || []);
    
    res.json({ 
      success: true, 
      data,
      params: { type, platformId, roomIds, start, end, dimensions }
    });
  } catch (err) {
    console.error('Error generating custom report:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

function calculateSummary(rooms) {
  let totalViewers = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalGiftValue = 0;
  let totalClicks = 0;
  let totalOrders = 0;
  let totalGMV = 0;
  
  rooms.forEach(roomData => {
    if (roomData.metrics && roomData.metrics.length > 0) {
      const lastMetric = roomData.metrics[roomData.metrics.length - 1];
      totalViewers += lastMetric.avg_viewer_count || 0;
    }
    
    roomData.metrics?.forEach(m => {
      totalLikes += m.total_likes || 0;
      totalComments += m.total_comments || 0;
      totalGiftValue += m.total_gift_value || 0;
      totalClicks += m.total_product_clicks || 0;
      totalOrders += m.total_orders || 0;
      totalGMV += m.total_order_amount || 0;
    });
  });
  
  return {
    totalViewers: Math.floor(totalViewers),
    totalLikes,
    totalComments,
    totalGiftValue: Math.round(totalGiftValue * 100) / 100,
    totalClicks,
    totalOrders,
    totalGMV: Math.round(totalGMV * 100) / 100,
    conversionRate: totalClicks > 0 ? Math.round((totalOrders / totalClicks) * 10000) / 100 : 0,
  };
}

module.exports = router;
