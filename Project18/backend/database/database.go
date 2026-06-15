package database

import (
	"delivery-optimizer/models"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	dataDir := "./data"
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Fatalf("Failed to create data directory: %v", err)
	}

	dbPath := filepath.Join(dataDir, "delivery.db")
	dsn := fmt.Sprintf("%s?_journal_mode=WAL&_busy_timeout=5000", dbPath)

	var err error
	DB, err = gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	err = DB.AutoMigrate(
		&models.Warehouse{},
		&models.Driver{},
		&models.Vehicle{},
		&models.Order{},
		&models.DeliveryRoute{},
		&models.RoutePoint{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	log.Println("Database initialized successfully")
}
