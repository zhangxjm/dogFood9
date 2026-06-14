const { initDatabase } = require('../database');
const { initSimulation } = require('../services/dataSimulator');
const { LiveRoom, LiveMetric, Product } = require('../models');
const { prepare, exec, transaction } = require('../database');
const moment = require('moment');

function generateRoomMetricAtTime(roomId, time) {
  const baseViewers = Math.floor(Math.random() * 5000) + 1000;
  const hourOfDay = time.hour();
  
  let timeMultiplier = 1;
  if (hourOfDay >= 19 && hourOfDay <= 23) {
    timeMultiplier = 1.5 + Math.random() * 0.5;
  } else if (hourOfDay >= 12 && hourOfDay <= 14) {
    timeMultiplier = 1.2 + Math.random() * 0.3;
  } else if (hourOfDay >= 0 && hourOfDay <= 6) {
    timeMultiplier = 0.3 + Math.random() * 0.2;
  } else {
    timeMultiplier = 0.8 + Math.random() * 0.4;
  }
  
  const viewerCount = Math.floor(baseViewers * timeMultiplier);
  const likes = Math.floor(Math.random() * viewerCount * 0.05);
  const comments = Math.floor(Math.random() * viewerCount * 0.01);
  const shares = Math.floor(Math.random() * viewerCount * 0.005);
  const gifts = Math.floor(Math.random() * viewerCount * 0.003);
  const giftValue = gifts * (Math.random() * 50 + 10);
  const productClicks = Math.floor(Math.random() * viewerCount * 0.02);
  const orders = Math.floor(productClicks * (Math.random() * 0.05 + 0.01));
  const orderAmount = orders * (Math.random() * 200 + 50);
  const conversionRate = productClicks > 0 ? (orders / productClicks) * 100 : 0;
  
  return {
    room_id: roomId,
    viewer_count: viewerCount,
    like_count: likes,
    comment_count: comments,
    share_count: shares,
    gift_count: gifts,
    gift_value: Math.round(giftValue * 100) / 100,
    product_click_count: productClicks,
    order_count: orders,
    order_amount: Math.round(orderAmount * 100) / 100,
    conversion_rate: Math.round(conversionRate * 100) / 100,
  };
}

function generateHistoricalData() {
  console.log('Generating historical data...');
  
  const rooms = LiveRoom.getAll();
  console.log(`Found ${rooms.length} live rooms`);
  
  const now = moment();
  const startTime = now.clone().subtract(24, 'hours');
  
  let currentTime = startTime.clone();
  let totalRecords = 0;
  
  console.log('Generating 24 hours of historical data (5-minute intervals)...');
  
  const insert = prepare(`
    INSERT INTO live_metrics 
    (room_id, timestamp, viewer_count, like_count, comment_count, share_count, gift_count, gift_value,
     product_click_count, order_count, order_amount, conversion_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  while (currentTime.isBefore(now)) {
    const timestamp = currentTime.format('YYYY-MM-DD HH:mm:ss');
    
    transaction(() => {
      rooms.forEach(room => {
        if (room.is_live) {
          const metric = generateRoomMetricAtTime(room.id, currentTime);
          insert.run(
            room.id,
            timestamp,
            metric.viewer_count,
            metric.like_count,
            metric.comment_count,
            metric.share_count,
            metric.gift_count,
            metric.gift_value,
            metric.product_click_count,
            metric.order_count,
            metric.order_amount,
            metric.conversion_rate
          );
          totalRecords++;
        }
      });
    });
    
    currentTime.add(5, 'minutes');
  }
  
  console.log(`Generated ${totalRecords} historical metric records`);
}

async function init() {
  console.log('='.repeat(50));
  console.log('Initializing Live Monitor Database');
  console.log('='.repeat(50));
  
  console.log('\n1. Setting up database schema...');
  await initDatabase();
  
  console.log('\n2. Initializing platforms and rooms...');
  initSimulation();
  
  console.log('\n3. Generating historical data...');
  generateHistoricalData();
  
  console.log('\n4. Verifying data...');
  const rooms = LiveRoom.getAll();
  console.log(`   Platforms: ${prepare('SELECT COUNT(*) as count FROM platforms').get().count}`);
  console.log(`   Live rooms: ${rooms.length}`);
  console.log(`   Metric records: ${prepare('SELECT COUNT(*) as count FROM live_metrics').get().count}`);
  console.log(`   Products: ${prepare('SELECT COUNT(*) as count FROM products').get().count}`);
  
  console.log('\n' + '='.repeat(50));
  console.log('Initialization complete!');
  console.log('='.repeat(50));
}

init();
