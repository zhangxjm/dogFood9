package services

import (
	"errors"
	"smart-irrigation/config"
	"smart-irrigation/models"
	"time"
)

func StartIrrigation(valveID uint, mode models.IrrigationMode, duration int, reason string) (*models.IrrigationRecord, error) {
	existing, err := models.GetRunningIrrigation(valveID)
	if err == nil && existing != nil {
		return nil, errors.New("irrigation is already running")
	}

	device, err := models.GetDeviceByID(valveID)
	if err != nil {
		return nil, errors.New("valve not found")
	}
	if device.Type != models.DeviceTypeValve {
		return nil, errors.New("device is not a valve")
	}

	now := time.Now()
	record := &models.IrrigationRecord{
		ValveID:   valveID,
		Mode:      mode,
		Status:    models.IrrigationStatusRunning,
		Duration:  duration,
		StartTime: &now,
		Reason:    reason,
	}

	if err := models.CreateIrrigationRecord(record); err != nil {
		return nil, errors.New("failed to create irrigation record")
	}

	go monitorIrrigation(record.ID, duration)

	return record, nil
}

func StopIrrigation(valveID uint) (*models.IrrigationRecord, error) {
	record, err := models.GetRunningIrrigation(valveID)
	if err != nil {
		return nil, errors.New("no running irrigation found")
	}

	now := time.Now()
	record.Status = models.IrrigationStatusStopped
	record.EndTime = &now

	if record.StartTime != nil {
		duration := int(now.Sub(*record.StartTime).Seconds())
		record.Duration = duration
		record.WaterAmount = float64(duration) * 0.1
	}

	if err := models.UpdateIrrigationRecord(record); err != nil {
		return nil, errors.New("failed to update irrigation record")
	}

	return record, nil
}

func monitorIrrigation(recordID uint, duration int) {
	if duration <= 0 {
		return
	}

	timer := time.NewTimer(time.Duration(duration) * time.Second)
	<-timer.C

	var record models.IrrigationRecord
	if err := models.DB.First(&record, recordID).Error; err != nil {
		return
	}

	if record.Status != models.IrrigationStatusRunning {
		return
	}

	now := time.Now()
	record.Status = models.IrrigationStatusCompleted
	record.EndTime = &now
	record.WaterAmount = float64(duration) * 0.1

	models.UpdateIrrigationRecord(&record)
}

func CalculateIrrigationNeed(sensorData models.SensorData, weatherData models.WeatherData) bool {
	minMoisture := config.AppConfig.Irrigation.MinSoilMoisture

	if sensorData.SoilMoisture < minMoisture {
		if weatherData.Rainfall < 2.0 {
			return true
		}
	}

	return false
}

func CalculateIrrigationDuration(sensorData models.SensorData, weatherData models.WeatherData) int {
	minMoisture := config.AppConfig.Irrigation.MinSoilMoisture
	maxMoisture := config.AppConfig.Irrigation.MaxSoilMoisture

	targetMoisture := (minMoisture + maxMoisture) / 2
	deficit := targetMoisture - sensorData.SoilMoisture

	if deficit <= 0 {
		return 0
	}

	baseDuration := deficit * 60

	evaporationFactor := 1.0
	if weatherData.Temperature > 30 {
		evaporationFactor = 1.2
	} else if weatherData.Temperature > 25 {
		evaporationFactor = 1.1
	}

	if weatherData.Humidity < 40 {
		evaporationFactor *= 1.1
	}

	if weatherData.WindSpeed > 10 {
		evaporationFactor *= 1.15
	}

	duration := int(float64(baseDuration) * evaporationFactor)

	if duration < 300 {
		duration = 300
	}
	if duration > 3600 {
		duration = 3600
	}

	return duration
}
