package scheduler

import (
	"fmt"
	"log"
	"math/rand"
	"smart-irrigation/models"
	"smart-irrigation/services"
	"smart-irrigation/websocket"
	"time"

	"github.com/robfig/cron/v3"
)

var cronScheduler *cron.Cron

func Start(wsHub *websocket.Hub) {
	cronScheduler = cron.New()

	setupScheduledTasks(wsHub)
	setupDataSimulation(wsHub)
	setupAutoIrrigationCheck(wsHub)
	setupDeviceStatusCheck(wsHub)

	cronScheduler.Start()
	log.Println("Scheduler started")
}

func setupScheduledTasks(wsHub *websocket.Hub) {
	schedules, err := models.GetEnabledSchedules()
	if err != nil {
		log.Println("Failed to load schedules:", err)
		return
	}

	for _, schedule := range schedules {
		sched := schedule
		_, err := cronScheduler.AddFunc(sched.CronExpr, func() {
			log.Printf("Executing schedule: %s", sched.Name)
			record, err := services.StartIrrigation(
				sched.ValveID,
				models.IrrigationModeSchedule,
				sched.Duration,
				"定时任务: "+sched.Name,
			)
			if err != nil {
				log.Printf("Schedule irrigation failed: %v", err)
				return
			}
			wsHub.Broadcast("irrigation_start", record)
		})
		if err != nil {
			log.Printf("Failed to add schedule %s: %v", sched.Name, err)
		}
	}
}

func setupDataSimulation(wsHub *websocket.Hub) {
	_, err := cronScheduler.AddFunc("@every 5s", func() {
		simulateSensorData(wsHub)
		simulateWeatherData(wsHub)
	})
	if err != nil {
		log.Println("Failed to add data simulation task:", err)
	}
}

func simulateSensorData(wsHub *websocket.Hub) {
	sensors, err := models.GetDevicesByType(models.DeviceTypeSoilSensor)
	if err != nil {
		return
	}

	for _, sensor := range sensors {
		if sensor.Status == models.DeviceStatusFault {
			continue
		}

		var latestData models.SensorData
		result := models.DB.Where("device_id = ?", sensor.ID).Order("timestamp desc").First(&latestData)

		soilMoisture := 50.0
		if result.Error == nil {
			soilMoisture = latestData.SoilMoisture + (rand.Float64()-0.5)*2
			if soilMoisture < 20 {
				soilMoisture = 20
			}
			if soilMoisture > 90 {
				soilMoisture = 90
			}
		}

		data := models.SensorData{
			DeviceID:     sensor.ID,
			Temperature:  20 + rand.Float64()*10,
			Humidity:     50 + rand.Float64()*30,
			SoilMoisture: soilMoisture,
			SoilTemp:     18 + rand.Float64()*8,
			PH:           6.5 + rand.Float64(),
			Timestamp:    time.Now(),
			CreatedAt:    time.Now(),
		}

		models.DB.Create(&data)
		models.UpdateDeviceStatus(sensor.ID, models.DeviceStatusOnline)
		wsHub.Broadcast("sensor_data", data)

		if soilMoisture < 30 {
			createLowMoistureAlert(sensor.ID, soilMoisture, wsHub)
		}
	}

	valves, _ := models.GetDevicesByType(models.DeviceTypeValve)
	for _, valve := range valves {
		if valve.Status == models.DeviceStatusFault {
			continue
		}
		models.UpdateDeviceStatus(valve.ID, models.DeviceStatusOnline)
	}
}

func simulateWeatherData(wsHub *websocket.Hub) {
	stations, err := models.GetDevicesByType(models.DeviceTypeWeatherStation)
	if err != nil {
		return
	}

	for _, station := range stations {
		if station.Status == models.DeviceStatusFault {
			continue
		}

		forecasts := []string{"晴", "多云", "阴", "小雨", "中雨"}
		forecast := forecasts[rand.Intn(len(forecasts))]

		rainfall := 0.0
		if forecast == "小雨" {
			rainfall = rand.Float64() * 5
		} else if forecast == "中雨" {
			rainfall = 5 + rand.Float64()*10
		}

		data := models.WeatherData{
			DeviceID:      station.ID,
			Temperature:   18 + rand.Float64()*12,
			Humidity:      50 + rand.Float64()*30,
			WindSpeed:     rand.Float64() * 15,
			WindDirection: []string{"北", "东北", "东", "东南", "南", "西南", "西", "西北"}[rand.Intn(8)],
			Rainfall:      rainfall,
			Pressure:      1000 + rand.Float64()*30,
			UVIndex:       rand.Float64() * 8,
			Forecast:      forecast,
			Timestamp:     time.Now(),
			CreatedAt:     time.Now(),
		}

		models.DB.Create(&data)
		models.UpdateDeviceStatus(station.ID, models.DeviceStatusOnline)
		wsHub.Broadcast("weather_data", data)
	}
}

func setupAutoIrrigationCheck(wsHub *websocket.Hub) {
	_, err := cronScheduler.AddFunc("@every 1m", func() {
		checkAutoIrrigation(wsHub)
	})
	if err != nil {
		log.Println("Failed to add auto irrigation check task:", err)
	}
}

func checkAutoIrrigation(wsHub *websocket.Hub) {
	sensors, err := models.GetDevicesByType(models.DeviceTypeSoilSensor)
	if err != nil {
		return
	}

	var latestWeather models.WeatherData
	models.DB.Order("timestamp desc").First(&latestWeather)

	for _, sensor := range sensors {
		var latestData models.SensorData
		result := models.DB.Where("device_id = ?", sensor.ID).Order("timestamp desc").First(&latestData)
		if result.Error != nil {
			continue
		}

		if !services.CalculateIrrigationNeed(latestData, latestWeather) {
			continue
		}

		valves, err := models.GetDevicesByType(models.DeviceTypeValve)
		if err != nil || len(valves) == 0 {
			continue
		}

		var targetValve *models.Device
		for i := range valves {
			if valves[i].Location == sensor.Location {
				targetValve = &valves[i]
				break
			}
		}

		if targetValve == nil {
			targetValve = &valves[0]
		}

		_, err = models.GetRunningIrrigation(targetValve.ID)
		if err == nil {
			continue
		}

		duration := services.CalculateIrrigationDuration(latestData, latestWeather)

		record, err := services.StartIrrigation(
			targetValve.ID,
			models.IrrigationModeAuto,
			duration,
			"智能灌溉: 土壤湿度过低",
		)
		if err != nil {
			log.Printf("Auto irrigation failed: %v", err)
			continue
		}

		log.Printf("Auto irrigation started for valve %d, duration: %ds", targetValve.ID, duration)
		wsHub.Broadcast("irrigation_start", record)
	}
}

func setupDeviceStatusCheck(wsHub *websocket.Hub) {
	_, err := cronScheduler.AddFunc("@every 1m", func() {
		checkDeviceStatus(wsHub)
	})
	if err != nil {
		log.Println("Failed to add device status check task:", err)
	}
}

func checkDeviceStatus(wsHub *websocket.Hub) {
	devices, err := models.GetAllDevices()
	if err != nil {
		return
	}

	now := time.Now()
	for _, device := range devices {
		if device.LastSeen == nil {
			continue
		}

		offlineDuration := now.Sub(*device.LastSeen)
		if offlineDuration > 2*time.Minute && device.Status == models.DeviceStatusOnline {
			models.UpdateDeviceStatus(device.ID, models.DeviceStatusOffline)
			createDeviceOfflineAlert(device.ID, device.Name, wsHub)
		}
	}
}

func createLowMoistureAlert(deviceID uint, moisture float64, wsHub *websocket.Hub) {
	alert := &models.Alert{
		Type:     models.AlertTypeLowMoisture,
		Level:    models.AlertLevelWarning,
		DeviceID: &deviceID,
		Title:    "土壤湿度过低",
		Message:  "土壤湿度低于警戒值，当前湿度: " + formatFloat(moisture) + "%",
	}
	models.CreateAlert(alert)
	wsHub.Broadcast("alert", alert)
}

func createDeviceOfflineAlert(deviceID uint, deviceName string, wsHub *websocket.Hub) {
	alert := &models.Alert{
		Type:     models.AlertTypeDeviceOffline,
		Level:    models.AlertLevelError,
		DeviceID: &deviceID,
		Title:    "设备离线",
		Message:  "设备 " + deviceName + " 已离线超过2分钟",
	}
	models.CreateAlert(alert)
	wsHub.Broadcast("alert", alert)
}

func formatFloat(v float64) string {
	return fmt.Sprintf("%.1f", v)
}
