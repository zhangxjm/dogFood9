package models

import (
	"time"

	"gorm.io/gorm"
)

// Device 设备模型
type Device struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Name         string         `gorm:"size:100;not null" json:"name" binding:"required"`
	Type         string         `gorm:"size:50;not null" json:"type" binding:"required"`
	Model        string         `gorm:"size:100" json:"model"`
	Location     string         `gorm:"size:100" json:"location"`
	Status       string         `gorm:"size:20;default:'运行中'" json:"status"`
	InstallDate  time.Time      `json:"install_date"`
	LastMaintain time.Time      `json:"last_maintain"`
	Description  string         `gorm:"size:500" json:"description"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	DeviceDataList    []DeviceData        `gorm:"foreignKey:DeviceID" json:"-"`
	FaultAlerts       []FaultAlert        `gorm:"foreignKey:DeviceID" json:"-"`
	MaintenanceRecords []MaintenanceRecord `gorm:"foreignKey:DeviceID" json:"-"`
	MaintenancePlans  []MaintenancePlan   `gorm:"foreignKey:DeviceID" json:"-"`
}

// TableName 指定表名
func (Device) TableName() string {
	return "devices"
}

// DeviceData 设备运行数据模型
type DeviceData struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	DeviceID  uint      `gorm:"index;not null" json:"device_id" binding:"required"`
	Timestamp time.Time `gorm:"index;not null" json:"timestamp"`
	Temp      float64   `json:"temp"`
	Vibration float64   `json:"vibration"`
	Pressure  float64   `json:"pressure"`
	Current   float64   `json:"current"`
	Runtime   float64   `json:"runtime"`
	CreatedAt time.Time `json:"created_at"`

	Device Device `gorm:"foreignKey:DeviceID" json:"-"`
}

// TableName 指定表名
func (DeviceData) TableName() string {
	return "device_data"
}

// FaultAlert 故障预警模型
type FaultAlert struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	DeviceID   uint      `gorm:"index;not null" json:"device_id" binding:"required"`
	AlertType  string    `gorm:"size:50;not null" json:"alert_type" binding:"required"`
	Level      string    `gorm:"size:20;not null" json:"level" binding:"required"`
	Message    string    `gorm:"size:500" json:"message"`
	Value      float64   `json:"value"`
	Threshold  float64   `json:"threshold"`
	Timestamp  time.Time `gorm:"index;not null" json:"timestamp"`
	IsResolved bool      `gorm:"default:false" json:"is_resolved"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`

	Device Device `gorm:"foreignKey:DeviceID" json:"-"`
}

// TableName 指定表名
func (FaultAlert) TableName() string {
	return "fault_alerts"
}

// MaintenanceRecord 维护记录模型
type MaintenanceRecord struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	DeviceID     uint      `gorm:"index;not null" json:"device_id" binding:"required"`
	MaintainType string    `gorm:"size:50;not null" json:"maintain_type" binding:"required"`
	Operator     string    `gorm:"size:50" json:"operator"`
	StartTime    time.Time `json:"start_time"`
	EndTime      time.Time `json:"end_time"`
	Content      string    `gorm:"type:text" json:"content"`
	Cost         float64   `json:"cost"`
	Remark       string    `gorm:"size:500" json:"remark"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	Device Device `gorm:"foreignKey:DeviceID" json:"-"`
}

// TableName 指定表名
func (MaintenanceRecord) TableName() string {
	return "maintenance_records"
}

// MaintenancePlan 维护计划模型
type MaintenancePlan struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	DeviceID         uint      `gorm:"index;not null" json:"device_id" binding:"required"`
	PlanName         string    `gorm:"size:100;not null" json:"plan_name" binding:"required"`
	PlanType         string    `gorm:"size:50" json:"plan_type"`
	Frequency        string    `gorm:"size:20" json:"frequency"`
	NextMaintainTime time.Time `json:"next_maintain_time"`
	Status           string    `gorm:"size:20;default:'待执行'" json:"status"`
	Remark           string    `gorm:"size:500" json:"remark"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`

	Device Device `gorm:"foreignKey:DeviceID" json:"-"`
}

// TableName 指定表名
func (MaintenancePlan) TableName() string {
	return "maintenance_plans"
}

// SparePart 备件模型
type SparePart struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Name        string         `gorm:"size:100;not null" json:"name" binding:"required"`
	Spec        string         `gorm:"size:100" json:"spec"`
	Unit        string         `gorm:"size:10" json:"unit"`
	UnitPrice   float64        `json:"unit_price"`
	Description string         `gorm:"size:500" json:"description"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Stocks []SparePartStock `gorm:"foreignKey:PartID" json:"-"`
}

// TableName 指定表名
func (SparePart) TableName() string {
	return "spare_parts"
}

// SparePartStock 备件库存模型
type SparePartStock struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	PartID     uint           `gorm:"index;not null" json:"part_id" binding:"required"`
	Warehouse  string         `gorm:"size:50;default:'主仓库'" json:"warehouse"`
	Quantity   int            `gorm:"default:0" json:"quantity"`
	MinStock   int            `gorm:"default:0" json:"min_stock"`
	MaxStock   int            `gorm:"default:0" json:"max_stock"`
	LastUpdate time.Time      `json:"last_update"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`

	Part SparePart `gorm:"foreignKey:PartID" json:"part,omitempty"`
}

// TableName 指定表名
func (SparePartStock) TableName() string {
	return "spare_part_stocks"
}

// PredictionResult 故障预测结果
type PredictionResult struct {
	DeviceID       uint    `json:"device_id"`
	FaultProbability float64 `json:"fault_probability"`
	RiskLevel      string  `json:"risk_level"`
	Factors        []string `json:"factors"`
	Recommendations []string `json:"recommendations"`
}

// StatisticsData 统计分析数据
type StatisticsData struct {
	TotalDevices      int64   `json:"total_devices"`
	RunningDevices    int64   `json:"running_devices"`
	FaultDevices      int64   `json:"fault_devices"`
	MaintenanceDevices int64  `json:"maintenance_devices"`
	StandbyDevices    int64   `json:"standby_devices"`
	TodayAlerts       int64   `json:"today_alerts"`
	UnresolvedAlerts  int64   `json:"unresolved_alerts"`
	TotalMaintainCost float64 `json:"total_maintain_cost"`
	LowStockCount     int64   `json:"low_stock_count"`
}
