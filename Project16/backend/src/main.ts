import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function bootstrap() {
  const dataDir = path.resolve('./data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  app.setGlobalPrefix('');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log('========================================');
  console.log('  智能酒店客房控制系统 - 后端服务');
  console.log('========================================');
  console.log(`HTTP 服务端口: ${port}`);
  console.log(`WebSocket 端口: ${process.env.WS_PORT || 3001}`);
  console.log(`数据库路径: ${process.env.DB_PATH || './data/hotel_iot.db'}`);
  console.log(`服务地址: http://localhost:${port}`);
  console.log('========================================');
  console.log('默认账号:');
  console.log('  管理员: admin / admin123');
  console.log('  员工: staff / staff123');
  console.log('  宾客: 101 / 10112345678901234 (入住后)');
  console.log('========================================');
  console.log('API 文档:');
  console.log('  POST /api/auth/login - 登录');
  console.log('  POST /api/auth/guest-login - 宾客登录');
  console.log('  GET  /api/rooms - 获取房间列表');
  console.log('  GET  /api/devices - 获取设备列表');
  console.log('  GET  /api/scenes - 获取场景列表');
  console.log('  POST /api/voice/command - 语音控制');
  console.log('  GET  /api/energy/statistics - 能耗统计');
  console.log('========================================');
}

bootstrap();
