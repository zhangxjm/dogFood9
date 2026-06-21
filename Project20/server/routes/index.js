const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const whiteboardRoutes = require('./whiteboards');
const operationRoutes = require('./operations');

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '协作白板后端服务运行正常',
    timestamp: new Date().toLocaleString('zh-CN')
  });
});

router.use('/auth', authRoutes);
router.use('/whiteboards', whiteboardRoutes);
router.use('/whiteboards', operationRoutes);

module.exports = router;
