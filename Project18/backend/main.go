package main

import (
	"delivery-optimizer/database"
	"delivery-optimizer/handlers"
	"delivery-optimizer/seed"
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	database.InitDB()
	seed.SeedData()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	{
		api.GET("/stats", handlers.GetStatistics)
		api.GET("/tracking", handlers.GetTrackingData)

		warehouses := api.Group("/warehouses")
		{
			warehouses.GET("", handlers.GetWarehouses)
			warehouses.GET("/:id", handlers.GetWarehouse)
			warehouses.POST("", handlers.CreateWarehouse)
			warehouses.PUT("/:id", handlers.UpdateWarehouse)
			warehouses.DELETE("/:id", handlers.DeleteWarehouse)
		}

		drivers := api.Group("/drivers")
		{
			drivers.GET("", handlers.GetDrivers)
			drivers.GET("/:id", handlers.GetDriver)
			drivers.POST("", handlers.CreateDriver)
			drivers.PUT("/:id", handlers.UpdateDriver)
			drivers.DELETE("/:id", handlers.DeleteDriver)
		}

		vehicles := api.Group("/vehicles")
		{
			vehicles.GET("", handlers.GetVehicles)
			vehicles.GET("/:id", handlers.GetVehicle)
			vehicles.POST("", handlers.CreateVehicle)
			vehicles.PUT("/:id", handlers.UpdateVehicle)
			vehicles.DELETE("/:id", handlers.DeleteVehicle)
			vehicles.PUT("/:id/location", handlers.UpdateVehicleLocation)
		}

		orders := api.Group("/orders")
		{
			orders.GET("", handlers.GetOrders)
			orders.GET("/:id", handlers.GetOrder)
			orders.POST("", handlers.CreateOrder)
			orders.PUT("/:id", handlers.UpdateOrder)
			orders.DELETE("/:id", handlers.DeleteOrder)
			orders.PUT("/:id/status", handlers.UpdateOrderStatus)
		}

		routes := api.Group("/routes")
		{
			routes.GET("", handlers.GetDeliveryRoutes)
			routes.GET("/:id", handlers.GetRouteDetail)
			routes.POST("/optimize", handlers.OptimizeRoutes)
			routes.POST("/save", handlers.SaveRoutes)
			routes.POST("/:id/start", handlers.StartRoute)
			routes.POST("/:id/complete", handlers.CompleteRoute)
		}
	}

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "配送路径优化服务运行正常",
		})
	})

	log.Println("Server starting on port 8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
