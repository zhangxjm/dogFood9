const { LiveRoom, LiveMetric, Product, Platform } = require('../models');

const platformsConfig = [
  { name: 'douyin', displayName: '抖音直播', logo: '' },
  { name: 'taobao', displayName: '淘宝直播', logo: '' },
  { name: 'kuaishou', displayName: '快手直播', logo: '' },
  { name: 'xiaohongshu', displayName: '小红书直播', logo: '' },
  { name: 'bilibili', displayName: '哔哩哔哩直播', logo: '' },
];

const roomsConfig = [
  { platform: 'douyin', roomId: 'DY001', title: '美妆好物节', streamerName: '李美丽', category: '美妆', products: 15 },
  { platform: 'douyin', roomId: 'DY002', title: '数码测评专场', streamerName: '科技老王', category: '数码', products: 20 },
  { platform: 'douyin', roomId: 'DY003', title: '美食探店', streamerName: '吃货小张', category: '美食', products: 10 },
  { platform: 'taobao', roomId: 'TB001', title: '服饰大促', streamerName: '时尚达人Amy', category: '服饰', products: 25 },
  { platform: 'taobao', roomId: 'TB002', title: '家居好物', streamerName: '生活家老李', category: '家居', products: 18 },
  { platform: 'kuaishou', roomId: 'KS001', title: '农产品助农', streamerName: '乡村小王', category: '农产品', products: 12 },
  { platform: 'kuaishou', roomId: 'KS002', title: '健身器材专场', streamerName: '健身教练阿强', category: '运动', products: 8 },
  { platform: 'xiaohongshu', roomId: 'XHS001', title: '护肤分享', streamerName: '护肤达人Luna', category: '护肤', products: 16 },
  { platform: 'bilibili', roomId: 'BL001', title: '游戏直播', streamerName: '游戏大神', category: '游戏', products: 5 },
  { platform: 'bilibili', roomId: 'BL002', title: '知识分享', streamerName: '学霸君', category: '知识', products: 6 },
];

const productNames = {
  '美妆': ['粉底液', '口红', '眼影盘', '面膜', '精华液', '面霜', '卸妆水', '睫毛膏', '腮红', '高光', '眉笔', '眼线笔', '唇釉', '散粉', '隔离霜'],
  '数码': ['手机', '耳机', '平板', '笔记本电脑', '智能手表', '相机', '充电宝', '数据线', '蓝牙音箱', '键盘', '鼠标', '显示器', '路由器', '移动硬盘', '游戏手柄', '电子书阅读器', '投影仪', '扫地机器人', '电动牙刷', '空气净化器'],
  '美食': ['零食大礼包', '坚果礼盒', '牛肉干', '巧克力', '饼干', '糖果', '方便面', '自热火锅', '螺蛳粉', '火腿肠'],
  '服饰': ['T恤', '牛仔裤', '连衣裙', '卫衣', '羽绒服', '运动鞋', '包包', '帽子', '围巾', '袜子', '内衣', '衬衫', '西装', '裙子', '外套', '毛衣', '风衣', '皮衣', '运动鞋', '高跟鞋', '平底鞋', '凉鞋', '拖鞋', '行李箱', '钱包'],
  '家居': ['抱枕', '台灯', '收纳盒', '香薰', '花瓶', '地毯', '窗帘', '床上四件套', '枕头', '被子', '毛巾', '浴巾', '拖鞋', '水杯', '餐具', '锅具', '刀具', '砧板'],
  '农产品': ['苹果', '橙子', '香蕉', '草莓', '葡萄', '西瓜', '鸡蛋', '大米', '面粉', '玉米', '土豆', '白菜', '萝卜', '西红柿', '黄瓜'],
  '运动': ['跑步机', '哑铃', '瑜伽垫', '跳绳', '弹力带', '健身球', '引体向上杆', '运动手环', '运动内衣', '运动鞋'],
  '护肤': ['洗面奶', '爽肤水', '乳液', '面霜', '精华', '面膜', '眼霜', '防晒霜', '卸妆油', '洁面仪', '美容仪', '护手霜', '身体乳', '沐浴露', '磨砂膏', '唇膜'],
  '游戏': ['游戏手柄', '游戏耳机', '游戏键盘', '游戏鼠标', '鼠标垫', '游戏椅', '游戏本', '显卡', '内存条', '固态硬盘'],
  '知识': ['书籍', '课程会员', '文具套装', '笔记本', '钢笔', '书包', '计算器', '学习机', '点读笔', '词典'],
};

let roomStates = {};

function initPlatforms() {
  platformsConfig.forEach(p => {
    Platform.create(p.name, p.displayName, p.logo);
  });
}

function initRooms() {
  roomsConfig.forEach(config => {
    const platform = Platform.getByName(config.platform);
    if (!platform) return;
    
    const room = LiveRoom.create(
      platform.id,
      config.roomId,
      config.title,
      config.streamerName,
      '',
      config.category
    );
    
    const productList = productNames[config.category] || productNames['美妆'];
    const numProducts = Math.min(config.products, productList.length);
    const selectedProducts = productList.slice(0, numProducts);
    
    selectedProducts.forEach((pName, idx) => {
      const price = Math.floor(Math.random() * 500) + 10;
      Product.createOrUpdate({
        room_id: room.id,
        product_id: `P${idx + 1}`,
        name: pName,
        price: price,
        image: '',
        click_count: 0,
        order_count: 0,
        order_amount: 0,
      });
    });
    
    roomStates[room.id] = {
      baseViewers: Math.floor(Math.random() * 5000) + 1000,
      viewerGrowth: (Math.random() - 0.5) * 100,
      viewerCount: Math.floor(Math.random() * 5000) + 1000,
      totalLikes: Math.floor(Math.random() * 10000),
      totalComments: Math.floor(Math.random() * 2000),
      totalShares: Math.floor(Math.random() * 500),
      totalGifts: Math.floor(Math.random() * 300),
      totalGiftValue: Math.floor(Math.random() * 5000),
      totalClicks: Math.floor(Math.random() * 3000),
      totalOrders: Math.floor(Math.random() * 200),
      totalOrderAmount: Math.floor(Math.random() * 20000),
    };
  });
}

function generateMetrics(roomId) {
  const state = roomStates[roomId];
  if (!state) return null;
  
  state.viewerCount += Math.floor(state.viewerGrowth + (Math.random() - 0.5) * 200);
  state.viewerCount = Math.max(100, Math.min(50000, state.viewerCount));
  
  state.viewerGrowth = (Math.random() - 0.5) * 50;
  
  const likes = Math.floor(Math.random() * state.viewerCount * 0.05);
  const comments = Math.floor(Math.random() * state.viewerCount * 0.01);
  const shares = Math.floor(Math.random() * state.viewerCount * 0.005);
  const gifts = Math.floor(Math.random() * state.viewerCount * 0.003);
  const giftValue = gifts * (Math.random() * 50 + 10);
  
  const productClicks = Math.floor(Math.random() * state.viewerCount * 0.02);
  const orders = Math.floor(productClicks * (Math.random() * 0.05 + 0.01));
  const orderAmount = orders * (Math.random() * 200 + 50);
  
  const conversionRate = productClicks > 0 ? (orders / productClicks) * 100 : 0;
  
  state.totalLikes += likes;
  state.totalComments += comments;
  state.totalShares += shares;
  state.totalGifts += gifts;
  state.totalGiftValue += giftValue;
  state.totalClicks += productClicks;
  state.totalOrders += orders;
  state.totalOrderAmount += orderAmount;
  
  return {
    room_id: roomId,
    viewer_count: state.viewerCount,
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

function updateProductStats(roomId, clicks, orders, amount) {
  const products = Product.getByRoom(roomId);
  if (products.length === 0) return;
  
  const targetProduct = products[Math.floor(Math.random() * products.length)];
  const perClick = Math.floor(clicks / products.length);
  const perOrder = Math.floor(orders / products.length) || 1;
  const perAmount = amount / products.length;
  
  Product.createOrUpdate({
    room_id: roomId,
    product_id: targetProduct.product_id,
    name: targetProduct.name,
    price: targetProduct.price,
    click_count: perClick + Math.floor(Math.random() * 10),
    order_count: perOrder,
    order_amount: perAmount,
  });
}

function generateAllMetrics() {
  const metrics = [];
  const rooms = LiveRoom.getAll();
  
  rooms.forEach(room => {
    if (room.is_live) {
      const metric = generateMetrics(room.id);
      if (metric) {
        metrics.push(metric);
        updateProductStats(room.id, metric.product_click_count, metric.order_count, metric.order_amount);
      }
    }
  });
  
  if (metrics.length > 0) {
    LiveMetric.bulkInsert(metrics);
  }
  
  return metrics;
}

function getRoomState(roomId) {
  return roomStates[roomId];
}

function initSimulation() {
  initPlatforms();
  initRooms();
  console.log('Data simulation initialized');
}

module.exports = {
  initSimulation,
  generateAllMetrics,
  getRoomState,
};
