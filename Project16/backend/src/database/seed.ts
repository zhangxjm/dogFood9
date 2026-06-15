import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

const dataSource = new DataSource({
  type: 'sqljs',
  location: path.resolve(process.env.DB_PATH || './data/hotel_iot.db'),
  autoSave: true,
  entities: [path.join(__dirname, '../entities/**/*.entity{.ts,.js}')],
  synchronize: true,
  logging: true,
});

async function seed() {
  const dataDir = path.resolve('./data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  await dataSource.initialize();
  console.log('Database connected');

  const userRepository = dataSource.getRepository('User');
  const roomRepository = dataSource.getRepository('Room');
  const deviceRepository = dataSource.getRepository('Device');
  const sceneRepository = dataSource.getRepository('Scene');

  console.log('Clearing existing data...');
  await dataSource.query('DELETE FROM device_logs');
  await dataSource.query('DELETE FROM energy_consumptions');
  await dataSource.query('DELETE FROM devices');
  await dataSource.query('DELETE FROM scenes');
  await dataSource.query('DELETE FROM rooms');
  await dataSource.query('DELETE FROM users');

  console.log('Creating users...');
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedStaffPassword = await bcrypt.hash('staff123', 10);

  const admin = userRepository.create({
    username: 'admin',
    password: hashedAdminPassword,
    name: '系统管理员',
    role: 'admin',
    phone: '13800138000',
  });
  await userRepository.save(admin);

  const staff = userRepository.create({
    username: 'staff',
    password: hashedStaffPassword,
    name: '前台员工',
    role: 'staff',
    phone: '13800138001',
  });
  await userRepository.save(staff);

  console.log('Creating rooms...');
  const roomTypes = ['标准间', '大床房', '双床房', '豪华套房', '总统套房'];
  const prices = [299, 359, 359, 699, 1299];
  
  const rooms = [];
  for (let floor = 1; floor <= 5; floor++) {
    for (let roomIndex = 1; roomIndex <= 8; roomIndex++) {
      const roomNumber = `${floor}${String(roomIndex).padStart(2, '0')}`;
      const typeIndex = Math.floor(Math.random() * roomTypes.length);
      
      const room = roomRepository.create({
        roomNumber,
        floor,
        roomType: roomTypes[typeIndex],
        pricePerNight: prices[typeIndex],
        status: 'vacant',
        powerEnabled: false,
      });
      rooms.push(await roomRepository.save(room));
    }
  }

  console.log('Creating devices for each room...');
  const deviceConfigs = [
    { name: '主灯', type: 'light', powerRating: 60, state: { brightness: 100, color: 'warm' } },
    { name: '床头灯', type: 'light', powerRating: 15, state: { brightness: 50, color: 'warm' } },
    { name: '浴室灯', type: 'light', powerRating: 30, state: { brightness: 100, color: 'white' } },
    { name: '空调', type: 'ac', powerRating: 1200, state: { temperature: 24, mode: 'cool', fanSpeed: 'auto' } },
    { name: '窗帘', type: 'curtain', powerRating: 50, state: { position: 0 } },
    { name: '电视', type: 'tv', powerRating: 150, state: { volume: 30, channel: 1, source: 'hdmi1' } },
  ];

  for (const room of rooms) {
    for (const config of deviceConfigs) {
      const device = deviceRepository.create({
        ...config,
        room,
        status: 'off',
        isOnline: true,
      });
      await deviceRepository.save(device);
    }
  }

  console.log('Creating default scenes for each room...');
  const defaultScenes = [
    {
      name: '睡眠模式',
      description: '关闭所有灯光，调暗空调，关闭窗帘',
      icon: 'moon',
      deviceStates: {
        light: { status: 'off' },
        ac: { status: 'on', settings: { temperature: 26, mode: 'sleep', fanSpeed: 'low' } },
        curtain: { status: 'on', settings: { position: 100 } },
        tv: { status: 'off' },
      },
    },
    {
      name: '阅读模式',
      description: '开启床头灯，调节适宜亮度',
      icon: 'book',
      deviceStates: {
        light: { status: 'on', settings: { brightness: 60, color: 'warm' } },
        ac: { status: 'on', settings: { temperature: 24, mode: 'cool', fanSpeed: 'auto' } },
        curtain: { status: 'on', settings: { position: 50 } },
        tv: { status: 'off' },
      },
    },
    {
      name: '观影模式',
      description: '调暗灯光，开启电视，关闭窗帘',
      icon: 'video',
      deviceStates: {
        light: { status: 'on', settings: { brightness: 20, color: 'warm' } },
        ac: { status: 'on', settings: { temperature: 24, mode: 'cool', fanSpeed: 'auto' } },
        curtain: { status: 'on', settings: { position: 100 } },
        tv: { status: 'on', settings: { volume: 25, source: 'hdmi1' } },
      },
    },
    {
      name: '离开模式',
      description: '关闭所有设备',
      icon: 'logout',
      deviceStates: {
        light: { status: 'off' },
        ac: { status: 'off' },
        curtain: { status: 'off', settings: { position: 0 } },
        tv: { status: 'off' },
      },
    },
    {
      name: '回家模式',
      description: '开启主灯和空调，打开窗帘',
      icon: 'home',
      deviceStates: {
        light: { status: 'on', settings: { brightness: 100, color: 'warm' } },
        ac: { status: 'on', settings: { temperature: 24, mode: 'cool', fanSpeed: 'auto' } },
        curtain: { status: 'on', settings: { position: 0 } },
        tv: { status: 'off' },
      },
    },
    {
      name: '浪漫模式',
      description: '柔和灯光，温馨氛围',
      icon: 'heart',
      deviceStates: {
        light: { status: 'on', settings: { brightness: 30, color: 'warm' } },
        ac: { status: 'on', settings: { temperature: 25, mode: 'cool', fanSpeed: 'low' } },
        curtain: { status: 'on', settings: { position: 80 } },
        tv: { status: 'off' },
      },
    },
  ];

  for (const room of rooms) {
    for (const sceneData of defaultScenes) {
      const scene = sceneRepository.create({
        ...sceneData,
        room,
        isGlobal: false,
      });
      await sceneRepository.save(scene);
    }
  }

  console.log('Creating demo check-in for room 101...');
  const demoGuest = userRepository.create({
    username: 'guest_101',
    password: await bcrypt.hash('10112345678901234', 10),
    name: '张三',
    role: 'guest',
    phone: '13900139000',
    idCard: '10112345678901234',
  });
  await userRepository.save(demoGuest);

  const room101 = rooms.find(r => r.roomNumber === '101');
  if (room101) {
    room101.status = 'occupied';
    room101.currentGuest = demoGuest;
    room101.checkInTime = new Date();
    room101.powerEnabled = true;
    await roomRepository.save(room101);

    const devices = await deviceRepository.find({ where: { room: { id: room101.id } } });
    for (const device of devices) {
      if (device.type === 'light' && device.name === '主灯') {
        device.status = 'on';
        device.lastStateChangeTime = new Date();
        await deviceRepository.save(device);
      }
      if (device.type === 'ac') {
        device.status = 'on';
        device.lastStateChangeTime = new Date();
        await deviceRepository.save(device);
      }
    }
  }

  console.log('Creating global scenes...');
  const globalScenes = [
    {
      name: '节能模式',
      description: '酒店统一节能模式',
      icon: 'leaf',
      isGlobal: true,
      deviceStates: {
        light: { status: 'off' },
        ac: { status: 'on', settings: { temperature: 26, mode: 'cool', fanSpeed: 'low' } },
        curtain: { status: 'off', settings: { position: 0 } },
        tv: { status: 'off' },
      },
    },
  ];

  for (const sceneData of globalScenes) {
    const scene = sceneRepository.create(sceneData);
    await sceneRepository.save(scene);
  }

  console.log('========================================');
  console.log('  数据初始化完成!');
  console.log('========================================');
  console.log('创建的用户:');
  console.log('  - 管理员: admin / admin123');
  console.log('  - 员工: staff / staff123');
  console.log('  - 演示宾客: 101 / 10112345678901234');
  console.log('创建的房间: 40 间 (1-5楼，每楼8间)');
  console.log('创建的设备: 240 个 (每房6个)');
  console.log('创建的场景: 240+ 个 (每房6个+全局)');
  console.log('========================================');
  console.log('演示房间 101 已入住');
  console.log('  宾客: 张三');
  console.log('  身份证: 10112345678901234');
  console.log('  房卡/登录密码: 10112345678901234');
  console.log('========================================');

  await dataSource.destroy();
  console.log('Database disconnected');
}

seed().catch(error => {
  console.error('Seed failed:', error);
  process.exit(1);
});
