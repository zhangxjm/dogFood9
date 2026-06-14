package models

import (
	"log"
	"math/rand"
	"time"
)

func SeedData() {
	var count int64
	DB.Model(&Device{}).Count(&count)
	if count > 0 {
		log.Println("Data already seeded, skipping...")
		return
	}

	log.Println("Seeding initial data...")

	devices := []Device{
		{
			Name:        "土壤湿度传感器A1",
			Type:        DeviceTypeSoilSensor,
			Status:      DeviceStatusOnline,
			Location:    "东区一号地块",
			Description: "监测土壤湿度、温度、PH值",
		},
		{
			Name:        "土壤湿度传感器A2",
			Type:        DeviceTypeSoilSensor,
			Status:      DeviceStatusOnline,
			Location:    "东区二号地块",
			Description: "监测土壤湿度、温度、PH值",
		},
		{
			Name:        "土壤湿度传感器B1",
			Type:        DeviceTypeSoilSensor,
			Status:      DeviceStatusOnline,
			Location:    "西区一号地块",
			Description: "监测土壤湿度、温度、PH值",
		},
		{
			Name:        "气象站一号",
			Type:        DeviceTypeWeatherStation,
			Status:      DeviceStatusOnline,
			Location:    "农场中心",
			Description: "监测气温、湿度、风速、降雨量等气象数据",
		},
		{
			Name:        "电磁阀V1",
			Type:        DeviceTypeValve,
			Status:      DeviceStatusOnline,
			Location:    "东区一号地块",
			Description: "控制东区一号地块灌溉",
		},
		{
			Name:        "电磁阀V2",
			Type:        DeviceTypeValve,
			Status:      DeviceStatusOnline,
			Location:    "东区二号地块",
			Description: "控制东区二号地块灌溉",
		},
		{
			Name:        "电磁阀V3",
			Type:        DeviceTypeValve,
			Status:      DeviceStatusOnline,
			Location:    "西区一号地块",
			Description: "控制西区一号地块灌溉",
		},
	}

	for i := range devices {
		now := time.Now()
		devices[i].LastSeen = &now
		if err := CreateDevice(&devices[i]); err != nil {
			log.Printf("Failed to create device %s: %v", devices[i].Name, err)
		}
	}

	now := time.Now()
	for i := 1; i <= 3; i++ {
		for j := 0; j < 24; j++ {
			timestamp := now.Add(-time.Duration(23-j) * time.Hour)
			sensorData := SensorData{
				DeviceID:     uint(i),
				Temperature:  15 + rand.Float64()*15,
				Humidity:     40 + rand.Float64()*40,
				SoilMoisture: 35 + rand.Float64()*30,
				SoilTemp:     18 + rand.Float64()*10,
				PH:           6.0 + rand.Float64()*1.5,
				Timestamp:    timestamp,
				CreatedAt:    timestamp,
			}
			DB.Create(&sensorData)
		}
	}

	for j := 0; j < 24; j++ {
		timestamp := now.Add(-time.Duration(23-j) * time.Hour)
		weatherData := WeatherData{
			DeviceID:      4,
			Temperature:   18 + rand.Float64()*12,
			Humidity:      50 + rand.Float64()*30,
			WindSpeed:     rand.Float64() * 15,
			WindDirection: []string{"北", "东北", "东", "东南", "南", "西南", "西", "西北"}[rand.Intn(8)],
			Rainfall:      rand.Float64() * 10,
			Pressure:      1000 + rand.Float64()*30,
			UVIndex:       rand.Float64() * 8,
			Forecast:      "晴",
			Timestamp:     timestamp,
			CreatedAt:     timestamp,
		}
		DB.Create(&weatherData)
	}

	schedules := []IrrigationSchedule{
		{
			Name:     "东区早间灌溉",
			ValveID:  5,
			CronExpr: "0 6 * * *",
			Duration: 1800,
			Enabled:  true,
		},
		{
			Name:     "东区晚间灌溉",
			ValveID:  6,
			CronExpr: "0 18 * * *",
			Duration: 1800,
			Enabled:  true,
		},
		{
			Name:     "西区午间灌溉",
			ValveID:  7,
			CronExpr: "0 12 * * *",
			Duration: 1500,
			Enabled:  false,
		},
	}

	for i := range schedules {
		if err := CreateSchedule(&schedules[i]); err != nil {
			log.Printf("Failed to create schedule %s: %v", schedules[i].Name, err)
		}
	}

	log.Println("Data seeding completed")
}
