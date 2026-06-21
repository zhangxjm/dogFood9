package routes

import (
	"backend/internal/handlers"
	"backend/internal/middleware"

	"github.com/gin-gonic/gin"
)

// SetupRoutes 配置所有路由
func SetupRoutes(r *gin.Engine) {
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.LoggerMiddleware())

	api := r.Group("/api/v1")
	{
		setupDeviceRoutes(api)
		setupDeviceDataRoutes(api)
		setupFaultAlertRoutes(api)
		setupMaintenanceRoutes(api)
		setupSparePartRoutes(api)
		setupStatisticsRoutes(api)
	}

	r.GET("/ws", handlers.WebSocketHandler)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"message": "设备管理后端服务运行正常",
		})
	})
}

// setupDeviceRoutes 设备相关路由
func setupDeviceRoutes(api *gin.RouterGroup) {
	devices := api.Group("/devices")
	{
		devices.GET("", handlers.GetDeviceList)
		devices.GET("/:id", handlers.GetDevice)
		devices.POST("", handlers.CreateDevice)
		devices.PUT("/:id", handlers.UpdateDevice)
		devices.DELETE("/:id", handlers.DeleteDevice)
	}
}

// setupDeviceDataRoutes 设备数据相关路由
func setupDeviceDataRoutes(api *gin.RouterGroup) {
	data := api.Group("/device-data")
	{
		data.GET("", handlers.GetDeviceDataList)
		data.GET("/latest/:device_id", handlers.GetLatestDeviceData)
		data.POST("/collect", handlers.CollectDeviceData)
		data.POST("/batch-collect", handlers.BatchCollectDeviceData)
		data.GET("/trend/:device_id", handlers.GetDeviceDataTrend)
	}
}

// setupFaultAlertRoutes 故障预警相关路由
func setupFaultAlertRoutes(api *gin.RouterGroup) {
	alerts := api.Group("/alerts")
	{
		alerts.GET("", handlers.GetFaultAlertList)
		alerts.GET("/:id", handlers.GetFaultAlert)
		alerts.POST("", handlers.CreateFaultAlert)
		alerts.PUT("/:id/resolve", handlers.ResolveFaultAlert)
		alerts.DELETE("/:id", handlers.DeleteFaultAlert)
	}
}

// setupMaintenanceRoutes 维护相关路由
func setupMaintenanceRoutes(api *gin.RouterGroup) {
	records := api.Group("/maintenance-records")
	{
		records.GET("", handlers.GetMaintenanceRecordList)
		records.GET("/:id", handlers.GetMaintenanceRecord)
		records.POST("", handlers.CreateMaintenanceRecord)
		records.PUT("/:id", handlers.UpdateMaintenanceRecord)
		records.DELETE("/:id", handlers.DeleteMaintenanceRecord)
	}

	plans := api.Group("/maintenance-plans")
	{
		plans.GET("", handlers.GetMaintenancePlanList)
		plans.GET("/:id", handlers.GetMaintenancePlan)
		plans.POST("", handlers.CreateMaintenancePlan)
		plans.PUT("/:id", handlers.UpdateMaintenancePlan)
		plans.DELETE("/:id", handlers.DeleteMaintenancePlan)
	}
}

// setupSparePartRoutes 备件相关路由
func setupSparePartRoutes(api *gin.RouterGroup) {
	parts := api.Group("/spare-parts")
	{
		parts.GET("", handlers.GetSparePartList)
		parts.GET("/:id", handlers.GetSparePart)
		parts.POST("", handlers.CreateSparePart)
		parts.PUT("/:id", handlers.UpdateSparePart)
		parts.DELETE("/:id", handlers.DeleteSparePart)
	}

	stocks := api.Group("/spare-part-stocks")
	{
		stocks.GET("", handlers.GetSparePartStockList)
		stocks.GET("/:id", handlers.GetSparePartStock)
		stocks.POST("", handlers.CreateSparePartStock)
		stocks.PUT("/:id", handlers.UpdateSparePartStock)
		stocks.DELETE("/:id", handlers.DeleteSparePartStock)
	}
}

// setupStatisticsRoutes 统计分析相关路由
func setupStatisticsRoutes(api *gin.RouterGroup) {
	stats := api.Group("/statistics")
	{
		stats.GET("/overview", handlers.GetStatistics)
		stats.GET("/device-status-distribution", handlers.GetDeviceStatusDistribution)
		stats.GET("/alert-type-distribution", handlers.GetAlertTypeDistribution)
		stats.GET("/maintenance-cost-trend", handlers.GetMaintenanceCostTrend)
	}

	predictions := api.Group("/predictions")
	{
		predictions.GET("/device/:device_id", handlers.PredictDeviceFault)
		predictions.GET("/all", handlers.PredictAllDevices)
	}
}
