package models

import (
	"time"
)

type DeviceType string

const (
	DeviceTypeSoilSensor   DeviceType = "soil_sensor"
	DeviceTypeWeatherStation DeviceType = "weather_station"
	DeviceTypeValve        DeviceType = "valve"
)

type DeviceStatus string

const (
	DeviceStatusOnline  DeviceStatus = "online"
	DeviceStatusOffline DeviceStatus = "offline"
	DeviceStatusFault   DeviceStatus = "fault"
)

type Device struct {
	ID          uint         `gorm:"primaryKey" json:"id"`
	Name        string       `gorm:"size:100;not null" json:"name"`
	Type        DeviceType   `gorm:"size:50;not null" json:"type"`
	Status      DeviceStatus `gorm:"size:20;default:offline" json:"status"`
	Location    string       `gorm:"size:200" json:"location"`
	Description string       `gorm:"size:500" json:"description"`
	LastSeen    *time.Time   `json:"last_seen"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

type SensorData struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	DeviceID    uint      `gorm:"index;not null" json:"device_id"`
	Temperature float64   `json:"temperature"`
	Humidity    float64   `json:"humidity"`
	SoilMoisture float64  `json:"soil_moisture"`
	SoilTemp    float64   `json:"soil_temp"`
	PH          float64   `json:"ph"`
	Timestamp   time.Time `gorm:"index" json:"timestamp"`
	CreatedAt   time.Time `json:"created_at"`
}

type WeatherData struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	DeviceID    uint      `gorm:"index;not null" json:"device_id"`
	Temperature float64   `json:"temperature"`
	Humidity    float64   `json:"humidity"`
	WindSpeed   float64   `json:"wind_speed"`
	WindDirection string   `json:"wind_direction"`
	Rainfall    float64   `json:"rainfall"`
	Pressure    float64   `json:"pressure"`
	UVIndex     float64   `json:"uv_index"`
	Forecast    string    `gorm:"size:50" json:"forecast"`
	Timestamp   time.Time `gorm:"index" json:"timestamp"`
	CreatedAt   time.Time `json:"created_at"`
}

func GetAllDevices() ([]Device, error) {
	var devices []Device
	result := DB.Find(&devices)
	return devices, result.Error
}

func GetDeviceByID(id uint) (*Device, error) {
	var device Device
	result := DB.First(&device, id)
	if result.Error != nil {
		return nil, result.Error
	}
	return &device, nil
}

func GetDevicesByType(deviceType DeviceType) ([]Device, error) {
	var devices []Device
	result := DB.Where("type = ?", deviceType).Find(&devices)
	return devices, result.Error
}

func CreateDevice(device *Device) error {
	return DB.Create(device).Error
}

func UpdateDevice(device *Device) error {
	return DB.Save(device).Error
}

func DeleteDevice(id uint) error {
	return DB.Delete(&Device{}, id).Error
}

func UpdateDeviceStatus(id uint, status DeviceStatus) error {
	now := time.Now()
	return DB.Model(&Device{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":   status,
		"last_seen": &now,
	}).Error
}
