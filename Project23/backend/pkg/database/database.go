package database

import (
	"backend/internal/config"
	"backend/internal/models"
	"backend/internal/utils"
	"math/rand"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// DB 全局数据库实例
var DB *gorm.DB

// DataBuffer 数据缓冲区，用于批量写入
var DataBuffer chan *models.DeviceData

// InitDatabase 初始化数据库连接
func InitDatabase() error {
	var err error
	DB, err = gorm.Open(sqlite.Open(config.GlobalConfig.Database.DSN), &gorm.Config{})
	if err != nil {
		return err
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return err
	}
	sqlDB.SetMaxOpenConns(config.GlobalConfig.Database.MaxOpenConn)
	sqlDB.SetMaxIdleConns(config.GlobalConfig.Database.MaxIdleConn)

	utils.AppLogger.Info("数据库连接成功")
	return nil
}

// AutoMigrate 自动迁移数据库表
func AutoMigrate() error {
	err := DB.AutoMigrate(
		&models.Device{},
		&models.DeviceData{},
		&models.FaultAlert{},
		&models.MaintenanceRecord{},
		&models.MaintenancePlan{},
		&models.SparePart{},
		&models.SparePartStock{},
	)
	if err != nil {
		return err
	}
	utils.AppLogger.Info("数据库表迁移完成")
	return nil
}

// InitDataBuffer 初始化数据缓冲区
func InitDataBuffer() {
	DataBuffer = make(chan *models.DeviceData, config.GlobalConfig.Data.BufferSize)
	utils.AppLogger.Infof("数据缓冲区初始化完成，缓冲区大小：%d", config.GlobalConfig.Data.BufferSize)
	go StartBatchWriter()
}

// StartBatchWriter 启动批量写入协程
func StartBatchWriter() {
	ticker := time.NewTicker(config.GlobalConfig.Data.FlushInterval)
	defer ticker.Stop()

	batch := make([]*models.DeviceData, 0, config.GlobalConfig.Data.BatchSize)

	for {
		select {
		case data := <-DataBuffer:
			batch = append(batch, data)
			if len(batch) >= config.GlobalConfig.Data.BatchSize {
				flushBatch(batch)
				batch = batch[:0]
			}
		case <-ticker.C:
			if len(batch) > 0 {
				flushBatch(batch)
				batch = batch[:0]
			}
		}
	}
}

// flushBatch 批量写入数据库
func flushBatch(batch []*models.DeviceData) {
	if len(batch) == 0 {
		return
	}
	err := DB.Create(&batch).Error
	if err != nil {
		utils.AppLogger.Errorf("批量写入设备数据失败：%v", err)
	}
}

// SeedMockData 初始化模拟数据
func SeedMockData() error {
	var count int64
	DB.Model(&models.Device{}).Count(&count)
	if count > 0 {
		utils.AppLogger.Info("检测到已有数据，跳过模拟数据初始化")
		return nil
	}

	utils.AppLogger.Info("开始初始化模拟数据...")

	deviceTypes := []string{"电机", "泵", "压缩机", "风机", "传送带"}
	deviceLocations := []string{"一号车间", "二号车间", "三号车间", "动力站", "仓储区"}
	statuses := []string{"运行中", "待机", "维护中", "故障"}

	devices := make([]models.Device, 0, 10)
	for i := 1; i <= 10; i++ {
		device := models.Device{
			Name:        "设备-" + string(rune(64+i)),
			Type:        deviceTypes[(i-1)%len(deviceTypes)],
			Model:       "Model-" + string(rune(64+i)) + "-00" + string(rune(48+i%10)),
			Location:    deviceLocations[(i-1)%len(deviceLocations)],
			Status:      statuses[(i-1)%len(statuses)],
			InstallDate: time.Now().AddDate(0, -rand.Intn(24), -rand.Intn(30)),
			LastMaintain: time.Now().AddDate(0, 0, -rand.Intn(90)),
			Description: "这是" + deviceTypes[(i-1)%len(deviceTypes)] + "的模拟数据",
		}
		devices = append(devices, device)
	}

	if err := DB.Create(&devices).Error; err != nil {
		return err
	}
	utils.AppLogger.Info("设备数据初始化完成，共10台设备")

	deviceDataList := make([]models.DeviceData, 0)
	for _, device := range devices {
		for j := 0; j < 50; j++ {
			baseTemp := 40.0 + rand.Float64()*30
			baseVibration := 1.0 + rand.Float64()*4
			basePressure := 0.5 + rand.Float64()*0.8
			baseCurrent := 5.0 + rand.Float64()*7

			if j%20 == 0 {
				baseTemp += 25
				baseVibration += 3
			}

			data := models.DeviceData{
				DeviceID:  device.ID,
				Timestamp: time.Now().Add(-time.Duration(50-j) * time.Minute),
				Temp:      baseTemp,
				Vibration: baseVibration,
				Pressure:  basePressure,
				Current:   baseCurrent,
				Runtime:   float64(j * 30),
			}
			deviceDataList = append(deviceDataList, data)
		}
	}
	if err := DB.Create(&deviceDataList).Error; err != nil {
		return err
	}
	utils.AppLogger.Infof("设备历史数据初始化完成，共%d条", len(deviceDataList))

	alertLevels := []string{"警告", "危险", "信息"}
	alertTypes := []string{"温度异常", "振动异常", "压力异常", "电流异常"}
	alerts := make([]models.FaultAlert, 0)
	for i := 0; i < 20; i++ {
		deviceIdx := rand.Intn(len(devices))
		alert := models.FaultAlert{
			DeviceID:    devices[deviceIdx].ID,
			AlertType:   alertTypes[i%len(alertTypes)],
			Level:       alertLevels[i%len(alertLevels)],
			Message:     alertTypes[i%len(alertTypes)] + "告警",
			Value:       rand.Float64() * 100,
			Threshold:   rand.Float64()*50 + 50,
			Timestamp:   time.Now().Add(-time.Duration(rand.Intn(24*7)) * time.Hour),
			IsResolved:  i%3 == 0,
		}
		alerts = append(alerts, alert)
	}
	if err := DB.Create(&alerts).Error; err != nil {
		return err
	}
	utils.AppLogger.Infof("故障预警数据初始化完成，共%d条", len(alerts))

	maintainTypes := []string{"日常巡检", "预防性维护", "故障维修", "部件更换"}
	operators := []string{"张工", "李工", "王工", "赵工"}
	maintainRecords := make([]models.MaintenanceRecord, 0)
	for i := 0; i < 15; i++ {
		deviceIdx := rand.Intn(len(devices))
		record := models.MaintenanceRecord{
			DeviceID:   devices[deviceIdx].ID,
			MaintainType: maintainTypes[i%len(maintainTypes)],
			Operator:   operators[i%len(operators)],
			StartTime:  time.Now().AddDate(0, 0, -rand.Intn(60)),
			EndTime:    time.Now().AddDate(0, 0, -rand.Intn(60)).Add(time.Duration(2+rand.Intn(6)) * time.Hour),
			Content:    maintainTypes[i%len(maintainTypes)] + "内容描述",
			Cost:       float64(100 + rand.Intn(5000)),
			Remark:     "维护记录备注信息",
		}
		maintainRecords = append(maintainRecords, record)
	}
	if err := DB.Create(&maintainRecords).Error; err != nil {
		return err
	}
	utils.AppLogger.Infof("维护记录初始化完成，共%d条", len(maintainRecords))

	plans := make([]models.MaintenancePlan, 0)
	for i := 0; i < 8; i++ {
		deviceIdx := rand.Intn(len(devices))
		frequencies := []string{"每天", "每周", "每月", "每季度"}
		status := []string{"进行中", "待执行", "已完成"}
		plan := models.MaintenancePlan{
			DeviceID:    devices[deviceIdx].ID,
			PlanName:    devices[deviceIdx].Name + "-" + frequencies[i%4] + "维护计划",
			PlanType:    maintainTypes[i%len(maintainTypes)],
			Frequency:   frequencies[i%4],
			NextMaintainTime: time.Now().AddDate(0, 0, 1+rand.Intn(30)),
			Status:      status[i%3],
			Remark:      "维护计划备注信息",
		}
		plans = append(plans, plan)
	}
	if err := DB.Create(&plans).Error; err != nil {
		return err
	}
	utils.AppLogger.Infof("维护计划初始化完成，共%d条", len(plans))

	sparePartNames := []string{"轴承", "密封圈", "电机转子", "过滤器", "润滑油", "皮带", "传感器", "控制器"}
	spareParts := make([]models.SparePart, 0)
	for i, name := range sparePartNames {
		part := models.SparePart{
			Name:        name,
			Spec:        "规格型号-" + string(rune(65+i)),
			Unit:        "个",
			UnitPrice:   float64(50 + rand.Intn(2000)),
			Description: name + "的详细描述信息",
		}
		spareParts = append(spareParts, part)
	}
	if err := DB.Create(&spareParts).Error; err != nil {
		return err
	}
	utils.AppLogger.Infof("备件基础数据初始化完成，共%d条", len(spareParts))

	stocks := make([]models.SparePartStock, 0)
	for _, part := range spareParts {
		stock := models.SparePartStock{
			PartID:      part.ID,
			Warehouse:   "主仓库",
			Quantity:    rand.Intn(200),
			MinStock:    10,
			MaxStock:    200,
			LastUpdate:  time.Now(),
		}
		stocks = append(stocks, stock)
	}
	if err := DB.Create(&stocks).Error; err != nil {
		return err
	}
	utils.AppLogger.Infof("备件库存数据初始化完成，共%d条", len(stocks))

	utils.AppLogger.Info("所有模拟数据初始化完成")
	return nil
}
