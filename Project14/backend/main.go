package main

import (
	"log"
	"smart-irrigation/config"
	"smart-irrigation/models"
	"smart-irrigation/routes"
	"smart-irrigation/scheduler"
	"smart-irrigation/websocket"
)

func main() {
	config.LoadConfig()

	models.InitDB()
	models.SeedData()

	wsHub := websocket.NewHub()
	go wsHub.Run()

	scheduler.Start(wsHub)

	r := routes.SetupRouter(wsHub)

	log.Println("Server starting on port", config.AppConfig.Server.Port)
	if err := r.Run(":" + config.AppConfig.Server.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
