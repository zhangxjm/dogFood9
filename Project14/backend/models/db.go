package models

import (
	"log"
	"smart-irrigation/config"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error
	DB, err = gorm.Open(sqlite.Open(config.AppConfig.Database.Path), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	err = DB.AutoMigrate(
		&Device{},
		&SensorData{},
		&WeatherData{},
		&IrrigationRecord{},
		&IrrigationSchedule{},
		&Alert{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database initialized successfully")
}
