package models

import (
	"time"
)

type IrrigationMode string

const (
	IrrigationModeManual   IrrigationMode = "manual"
	IrrigationModeAuto     IrrigationMode = "auto"
	IrrigationModeSchedule IrrigationMode = "schedule"
)

type IrrigationStatus string

const (
	IrrigationStatusRunning  IrrigationStatus = "running"
	IrrigationStatusStopped  IrrigationStatus = "stopped"
	IrrigationStatusCompleted IrrigationStatus = "completed"
)

type IrrigationRecord struct {
	ID         uint             `gorm:"primaryKey" json:"id"`
	ValveID    uint             `gorm:"index;not null" json:"valve_id"`
	Mode       IrrigationMode   `gorm:"size:20;not null" json:"mode"`
	Status     IrrigationStatus `gorm:"size:20;not null" json:"status"`
	Duration   int              `json:"duration"`
	WaterAmount float64         `json:"water_amount"`
	StartTime  *time.Time       `json:"start_time"`
	EndTime    *time.Time       `json:"end_time"`
	Reason     string           `gorm:"size:500" json:"reason"`
	CreatedAt  time.Time        `json:"created_at"`
	UpdatedAt  time.Time        `json:"updated_at"`
}

type IrrigationSchedule struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	Name       string         `gorm:"size:100;not null" json:"name"`
	ValveID    uint           `gorm:"index;not null" json:"valve_id"`
	CronExpr   string         `gorm:"size:50;not null" json:"cron_expr"`
	Duration   int            `gorm:"not null" json:"duration"`
	Enabled    bool           `gorm:"default:true" json:"enabled"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
}

func CreateIrrigationRecord(record *IrrigationRecord) error {
	return DB.Create(record).Error
}

func UpdateIrrigationRecord(record *IrrigationRecord) error {
	return DB.Save(record).Error
}

func GetLatestIrrigationRecord(valveID uint) (*IrrigationRecord, error) {
	var record IrrigationRecord
	result := DB.Where("valve_id = ?", valveID).Order("start_time desc").First(&record)
	if result.Error != nil {
		return nil, result.Error
	}
	return &record, nil
}

func GetRunningIrrigation(valveID uint) (*IrrigationRecord, error) {
	var record IrrigationRecord
	result := DB.Where("valve_id = ? AND status = ?", valveID, IrrigationStatusRunning).First(&record)
	if result.Error != nil {
		return nil, result.Error
	}
	return &record, nil
}

func GetIrrigationRecords(limit int) ([]IrrigationRecord, error) {
	var records []IrrigationRecord
	result := DB.Order("created_at desc").Limit(limit).Find(&records)
	return records, result.Error
}

func GetAllSchedules() ([]IrrigationSchedule, error) {
	var schedules []IrrigationSchedule
	result := DB.Find(&schedules)
	return schedules, result.Error
}

func CreateSchedule(schedule *IrrigationSchedule) error {
	return DB.Create(schedule).Error
}

func UpdateSchedule(schedule *IrrigationSchedule) error {
	return DB.Save(schedule).Error
}

func DeleteSchedule(id uint) error {
	return DB.Delete(&IrrigationSchedule{}, id).Error
}

func GetEnabledSchedules() ([]IrrigationSchedule, error) {
	var schedules []IrrigationSchedule
	result := DB.Where("enabled = ?", true).Find(&schedules)
	return schedules, result.Error
}
