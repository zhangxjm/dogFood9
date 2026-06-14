package models

import (
	"time"
)

type AlertLevel string

const (
	AlertLevelInfo    AlertLevel = "info"
	AlertLevelWarning AlertLevel = "warning"
	AlertLevelError   AlertLevel = "error"
	AlertLevelCritical AlertLevel = "critical"
)

type AlertType string

const (
	AlertTypeDeviceOffline  AlertType = "device_offline"
	AlertTypeDeviceFault    AlertType = "device_fault"
	AlertTypeLowMoisture    AlertType = "low_moisture"
	AlertTypeHighMoisture   AlertType = "high_moisture"
	AlertTypeIrrigationFail AlertType = "irrigation_fail"
	AlertTypeSystemError    AlertType = "system_error"
)

type Alert struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	Type       AlertType  `gorm:"size:50;not null" json:"type"`
	Level      AlertLevel `gorm:"size:20;not null" json:"level"`
	DeviceID   *uint      `gorm:"index" json:"device_id"`
	Title      string     `gorm:"size:200;not null" json:"title"`
	Message    string     `gorm:"size:1000" json:"message"`
	Resolved   bool       `gorm:"default:false" json:"resolved"`
	ResolvedAt *time.Time `json:"resolved_at"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

func CreateAlert(alert *Alert) error {
	return DB.Create(alert).Error
}

func GetAlerts(resolved *bool, limit int) ([]Alert, error) {
	var alerts []Alert
	query := DB.Order("created_at desc")
	if resolved != nil {
		query = query.Where("resolved = ?", *resolved)
	}
	result := query.Limit(limit).Find(&alerts)
	return alerts, result.Error
}

func ResolveAlert(id uint) error {
	now := time.Now()
	return DB.Model(&Alert{}).Where("id = ?", id).Updates(map[string]interface{}{
		"resolved":    true,
		"resolved_at": &now,
	}).Error
}

func GetUnresolvedCount() (int64, error) {
	var count int64
	result := DB.Model(&Alert{}).Where("resolved = ?", false).Count(&count)
	return count, result.Error
}
