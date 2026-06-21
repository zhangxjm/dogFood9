package config

import "time"

// Config 全局配置结构体
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	ML       MLConfig
	Data     DataConfig
}

// ServerConfig 服务配置
type ServerConfig struct {
	Port         string
	ReadTimeout  time.Duration
	WriteTimeout time.Duration
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	DSN         string
	MaxOpenConn int
	MaxIdleConn int
}

// MLConfig 机器学习配置
type MLConfig struct {
	// 温度阈值（摄氏度）
	TempWarning float64
	TempDanger  float64
	// 振动阈值（mm/s）
	VibrationWarning float64
	VibrationDanger  float64
	// 压力阈值（MPa）
	PressureWarning float64
	PressureDanger  float64
	// 电流阈值（A）
	CurrentWarning float64
	CurrentDanger  float64
}

// DataConfig 数据采集配置
type DataConfig struct {
	// 批量写入大小
	BatchSize int
	// 缓冲区大小
	BufferSize int
	// 刷新间隔（毫秒）
	FlushInterval time.Duration
}

// GlobalConfig 全局配置实例
var GlobalConfig = Config{
	Server: ServerConfig{
		Port:         ":8080",
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	},
	Database: DatabaseConfig{
		DSN:         "backend.db",
		MaxOpenConn: 100,
		MaxIdleConn: 10,
	},
	ML: MLConfig{
		TempWarning:      70.0,
		TempDanger:       90.0,
		VibrationWarning: 4.5,
		VibrationDanger:  7.0,
		PressureWarning:  1.2,
		PressureDanger:   1.6,
		CurrentWarning:   12.0,
		CurrentDanger:    15.0,
	},
	Data: DataConfig{
		BatchSize:     100,
		BufferSize:    1000,
		FlushInterval: 500 * time.Millisecond,
	},
}
