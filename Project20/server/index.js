const express = require('express');
const http = require('http');
const cors = require('cors');

const { initDatabase } = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware');
const setupSocketIO = require('./socket');

const PORT = process.env.PORT || 3001;

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({
    name: '协作白板后端服务',
    version: '1.0.0',
    status: '运行中',
    endpoints: {
      api_base: '/api',
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me'
      },
      whiteboards: {
        list: 'GET /api/whiteboards',
        create: 'POST /api/whiteboards',
        detail: 'GET /api/whiteboards/:id',
        update: 'PUT /api/whiteboards/:id',
        delete: 'DELETE /api/whiteboards/:id'
      },
      versions: {
        list: 'GET /api/whiteboards/:id/versions',
        create: 'POST /api/whiteboards/:id/versions',
        restore: 'POST /api/whiteboards/:id/versions/:vid/restore'
      }
    },
    socket_io: 'Socket.IO 服务运行在同端口',
    docs: '所有界面文字和提示均使用中文'
  });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

setupSocketIO(server);

async function startServer() {
  try {
    await initDatabase();

    server.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('  协作白板后端服务启动成功!');
      console.log('='.repeat(60));
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  API 基础路径: http://localhost:${PORT}/api`);
      console.log(`  健康检查: http://localhost:${PORT}/api/health`);
      console.log(`  Socket.IO: ws://localhost:${PORT}`);
      console.log('='.repeat(60));
      console.log('  CORS 允许的来源:');
      console.log('    - http://localhost:3000');
      console.log('    - http://localhost:5173');
      console.log('='.repeat(60));
      console.log('  默认测试账号:');
      console.log('    用户名: admin');
      console.log('    密码:   admin123');
      console.log('='.repeat(60) + '\n');
    });
  } catch (err) {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  }
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`错误: 端口 ${PORT} 已被占用，请使用其他端口或关闭占用该端口的程序`);
    process.exit(1);
  } else {
    console.error('服务器启动错误:', err);
    process.exit(1);
  }
});

process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

startServer();

module.exports = app;
