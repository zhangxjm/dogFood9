package config

type ServerConfig struct {
	Port string
}

type DatabaseConfig struct {
	Path string
}

type IrrigationConfig struct {
	MinSoilMoisture float64
	MaxSoilMoisture float64
	CheckInterval   int
}

type Config struct {
	Server     ServerConfig
	Database   DatabaseConfig
	Irrigation IrrigationConfig
}

var AppConfig Config

func LoadConfig() {
	AppConfig = Config{
		Server: ServerConfig{
			Port: "9000",
		},
		Database: DatabaseConfig{
			Path: "./smart_irrigation.db",
		},
		Irrigation: IrrigationConfig{
			MinSoilMoisture: 30.0,
			MaxSoilMoisture: 70.0,
			CheckInterval:   30,
		},
	}
}
