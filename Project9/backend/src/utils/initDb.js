const { getDb, closeDb } = require('./db');

function createTables() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      model TEXT,
      manufacturer TEXT,
      serial_number TEXT,
      purchase_date TEXT,
      purchase_price REAL,
      supplier TEXT,
      location TEXT,
      install_date TEXT,
      warranty_start TEXT,
      warranty_end TEXT,
      status TEXT DEFAULT 'purchased',
      health_score INTEGER DEFAULT 100,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lifecycle_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER NOT NULL,
      stage TEXT NOT NULL,
      action TEXT NOT NULL,
      operator TEXT,
      description TEXT,
      record_date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS maintenance_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER NOT NULL,
      plan_name TEXT NOT NULL,
      plan_type TEXT NOT NULL,
      frequency TEXT NOT NULL,
      interval_days INTEGER NOT NULL,
      last_maintenance_date TEXT,
      next_maintenance_date TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      equipment_id INTEGER NOT NULL,
      plan_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      order_type TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'pending',
      assigned_to TEXT,
      scheduled_date TEXT,
      completed_date TEXT,
      spare_parts_used TEXT,
      cost REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES maintenance_plans(id)
    );

    CREATE TABLE IF NOT EXISTS spare_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      specification TEXT,
      unit TEXT,
      quantity INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 10,
      max_stock INTEGER DEFAULT 100,
      unit_price REAL,
      supplier TEXT,
      location TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      work_order_id INTEGER,
      operator TEXT,
      description TEXT,
      transaction_date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (part_id) REFERENCES spare_parts(id) ON DELETE CASCADE,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id)
    );

    CREATE TABLE IF NOT EXISTS health_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment_id INTEGER NOT NULL,
      check_date TEXT DEFAULT CURRENT_TIMESTAMP,
      running_hours REAL,
      temperature REAL,
      vibration REAL,
      pressure REAL,
      power_consumption REAL,
      error_codes TEXT,
      health_score INTEGER,
      assessment TEXT,
      recommendations TEXT,
      FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS queue_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id TEXT UNIQUE NOT NULL,
      queue_name TEXT NOT NULL,
      job_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      payload TEXT,
      result TEXT,
      error TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      started_at TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      log_level TEXT NOT NULL,
      module TEXT,
      message TEXT NOT NULL,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database tables created successfully.');
}

function seedData() {
  const db = getDb();

  const equipmentCount = db.prepare('SELECT COUNT(*) as count FROM equipment').get();
  if (equipmentCount.count > 0) {
    console.log('Database already has seed data, skipping.');
    return;
  }

  const insertEquipment = db.prepare(`
    INSERT INTO equipment (equipment_code, name, category, model, manufacturer, 
      serial_number, purchase_date, purchase_price, supplier, location, 
      install_date, warranty_start, warranty_end, status, health_score, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const equipmentData = [
    ['EQ-2024-001', '数控车床', '金属加工', 'CK6140', '沈阳机床', 'SN202401001', '2024-01-15', 285000, '沈阳机床厂', '一号车间A区', '2024-01-20', '2024-01-20', '2027-01-20', 'running', 92, '高精度数控车床，用于精密零件加工'],
    ['EQ-2024-002', '工业机器人', '自动化', 'IRB6700', 'ABB', 'SN202402001', '2024-02-10', 450000, 'ABB中国', '二号车间B区', '2024-02-18', '2024-02-18', '2029-02-18', 'running', 88, '六轴工业机器人，用于焊接工位'],
    ['EQ-2024-003', '空压机', '动力设备', 'GA110', '阿特拉斯', 'SN202403001', '2024-03-05', 120000, '阿特拉斯科普柯', '动力站房', '2024-03-12', '2024-03-12', '2027-03-12', 'running', 95, '螺杆式空气压缩机'],
    ['EQ-2024-004', '注塑机', '塑料成型', 'MA1600', '海天塑机', 'SN202404001', '2024-04-20', 320000, '海天国际', '三号车间C区', '2024-04-28', '2024-04-28', '2027-04-28', 'maintenance', 75, '大型注塑机，计划本月保养中'],
    ['EQ-2024-005', '数控铣床', '金属加工', 'VMC850', '大连机床', 'SN202405001', '2024-05-10', 198000, '大连机床厂', '一号车间A区', '2024-05-18', '2024-05-18', '2027-05-18', 'running', 90, '立式加工中心'],
    ['EQ-2024-006', '输送带系统', '物流设备', 'SS-200', '德马泰克', 'SN202406001', '2024-06-01', 156000, '德马泰克中国', '物流仓储区', '2024-06-10', '2024-06-10', '2027-06-10', 'purchased', 100, '智能物流输送系统，待安装'],
  ];

  const equipmentIds = [];
  for (const equip of equipmentData) {
    const result = insertEquipment.run(...equip);
    equipmentIds.push(result.lastInsertRowid);
  }

  const insertLifecycle = db.prepare(`
    INSERT INTO lifecycle_records (equipment_id, stage, action, operator, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertLifecycle.run(1, 'purchase', '采购入库', '系统管理员', '设备采购完成，已入库待验收');
  insertLifecycle.run(1, 'install', '安装调试', '张工程师', '设备安装完成，调试合格');
  insertLifecycle.run(2, 'purchase', '采购入库', '系统管理员', '设备采购完成');
  insertLifecycle.run(2, 'install', '安装调试', '李工程师', '机器人现场安装调试完成');
  insertLifecycle.run(3, 'purchase', '采购入库', '系统管理员', '空压机采购完成');
  insertLifecycle.run(3, 'install', '安装调试', '王工程师', '空压机站安装完成');
  insertLifecycle.run(4, 'purchase', '采购入库', '系统管理员', '注塑机采购完成');
  insertLifecycle.run(4, 'install', '安装调试', '赵工程师', '注塑机安装调试完成');
  insertLifecycle.run(4, 'maintenance', '计划保养', '维护班组', '定期维保中');
  insertLifecycle.run(5, 'purchase', '采购入库', '系统管理员', '数控铣床采购完成');
  insertLifecycle.run(5, 'install', '安装调试', '孙工程师', '铣床安装调试完成');
  insertLifecycle.run(6, 'purchase', '采购入库', '系统管理员', '输送带系统采购完成，待安装');

  const insertPlan = db.prepare(`
    INSERT INTO maintenance_plans (equipment_id, plan_name, plan_type, frequency, 
      interval_days, next_maintenance_date, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  insertPlan.run(1, '数控车床日常保养', 'routine', 'daily', 1, addDays(now, 1), '每日班前检查、清洁、润滑');
  insertPlan.run(1, '数控车床月度保养', 'routine', 'monthly', 30, addDays(now, 7), '月度全面检查、易损件检查');
  insertPlan.run(1, '数控车床季度大修', 'major', 'quarterly', 90, addDays(now, 30), '季度全面检修、精度校准');
  insertPlan.run(2, '机器人日常点检', 'routine', 'daily', 1, addDays(now, 1), '每日点检');
  insertPlan.run(2, '机器人年度保养', 'major', 'yearly', 365, addDays(now, 180), '机器人全面保养、润滑油更换');
  insertPlan.run(3, '空压机日常检查', 'routine', 'daily', 1, addDays(now, 1), '每日压力、温度检查');
  insertPlan.run(3, '空压机滤芯更换', 'routine', 'monthly', 30, addDays(now, 15), '空气滤芯、油滤芯更换');
  insertPlan.run(4, '注塑机日常保养', 'routine', 'daily', 1, addDays(now, 1), '注塑机日常检查');
  insertPlan.run(4, '注塑机液压油更换', 'major', 'quarterly', 90, addDays(now, 60), '液压系统液压油更换');
  insertPlan.run(5, '铣床日常保养', 'routine', 'daily', 1, addDays(now, 1), '铣床日常点检');

  const insertOrder = db.prepare(`
    INSERT INTO work_orders (order_no, equipment_id, plan_id, title, description, 
      order_type, priority, status, assigned_to, scheduled_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertOrder.run('WO-2024-001', 1, 2, '数控车床月度保养', '检查主轴、导轨、换油', 'maintenance', 'normal', 'completed', '张师傅', '2024-06-01');
  insertOrder.run('WO-2024-002', 3, 7, '空压机滤芯更换', '更换空气滤芯和油滤芯', 'maintenance', 'normal', 'completed', '李师傅', '2024-06-05');
  insertOrder.run('WO-2024-003', 4, null, '注塑机液压系统故障', '系统压力不稳定，需要检修', 'repair', 'high', 'in_progress', '王师傅', '2024-06-10');
  insertOrder.run('WO-2024-004', 2, null, '机器人焊枪更换', '焊枪磨损严重，需要更换', 'repair', 'medium', 'pending', '赵师傅', '2024-06-15');
  insertOrder.run('WO-2024-005', 5, 10, '铣床日常保养', '日常点检和润滑', 'maintenance', 'low', 'pending', '孙师傅', '2024-06-13');

  const insertPart = db.prepare(`
    INSERT INTO spare_parts (part_code, name, category, specification, unit, 
      quantity, min_stock, max_stock, unit_price, supplier, location, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPart.run('SP-001', '轴承', '传动件', '6205-2RS', '个', 50, 20, 100, 85, 'SKF', 'A区-01', '深沟球轴承');
  insertPart.run('SP-002', '润滑油', '润滑', 'ISO VG68', '桶', 15, 10, 50, 320, '美孚', 'B区-03', '机械润滑油');
  insertPart.run('SP-003', '空气滤芯', '过滤件', 'C20500', '个', 8, 5, 30, 180, '阿特拉斯', 'C区-02', '空压机空气滤芯');
  insertPart.run('SP-004', '液压油', '液压', '抗磨46号', '桶', 5, 5, 20, 450, '壳牌', 'B区-01', '抗磨液压油');
  insertPart.run('SP-005', '密封圈', '密封件', 'NBR70', '套', 200, 100, 500, 15, 'NOK', 'A区-05', 'O型密封圈套装');
  insertPart.run('SP-006', '焊枪喷嘴', '易损件', 'W500', '个', 3, 10, 50, 1200, '福尼斯', 'D区-01', '机器人焊枪喷嘴');
  insertPart.run('SP-007', '导轨滑块', '传动件', 'HGH25CA', '个', 12, 5, 30, 680, '上银', 'A区-02', '直线导轨滑块');
  insertPart.run('SP-008', '滤芯', '过滤件', '油滤芯', '个', 6, 10, 40, 280, '阿特拉斯', 'C区-02', '压缩机油滤芯');

  const insertTransaction = db.prepare(`
    INSERT INTO inventory_transactions (part_id, transaction_type, quantity, 
      work_order_id, operator, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertTransaction.run(2, 'out', 2, 1, '张师傅', '数控车床保养用油');
  insertTransaction.run(3, 'out', 1, 2, '李师傅', '空压机滤芯更换');
  insertTransaction.run(4, 'out', 3, 3, '王师傅', '注塑机液压系统维修');

  const insertHealth = db.prepare(`
    INSERT INTO health_records (equipment_id, running_hours, temperature, 
      vibration, pressure, power_consumption, error_codes, health_score, 
      assessment, recommendations)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertHealth.run(1, 4520, 42, 2.1, 0.6, 15.5, '', 92, '运行状态良好', '继续按计划保养');
  insertHealth.run(2, 3800, 38, 1.8, 0.5, 12.0, '', 88, '运行正常', '焊枪磨损建议近期更换');
  insertHealth.run(3, 5200, 65, 3.2, 0.75, 45.0, '', 95, '状态良好', '按计划更换滤芯');
  insertHealth.run(4, 2900, 55, 4.5, 0.65, 38.0, 'E-001,E-003', 75, '液压系统异常', '检查液压泵，更换液压油');
  insertHealth.run(5, 1800, 40, 2.5, 0.55, 18.0, '', 90, '运行正常', '定期检查刀具磨损');

  console.log('Seed data inserted successfully.');
}

function initDatabase(closeAfterInit = false) {
  try {
    const fs = require('fs');
    const path = require('path');
    const config = require('../config');
    const dbDir = path.resolve(__dirname, '../../', path.dirname(config.db.path));
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    createTables();
    seedData();
    console.log('Database initialization completed successfully.');
    
    if (closeAfterInit) {
      closeDb();
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

if (require.main === module) {
  initDatabase(true);
}

module.exports = {
  createTables,
  seedData,
  initDatabase,
};
