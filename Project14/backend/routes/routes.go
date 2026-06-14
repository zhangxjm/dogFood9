package routes

import (
	"smart-irrigation/controllers"
	"smart-irrigation/middleware"
	"smart-irrigation/websocket"

	"github.com/gin-gonic/gin"
)

func SetupRouter(wsHub *websocket.Hub) *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORS())
	r.Use(middleware.RequestLogger())

	api := r.Group("/api")
	{
		devices := api.Group("/devices")
		{
			devices.GET("", controllers.GetDevices)
			devices.GET("/:id", controllers.GetDevice)
			devices.POST("", controllers.CreateDevice)
			devices.PUT("/:id", controllers.UpdateDevice)
			devices.DELETE("/:id", controllers.DeleteDevice)
			devices.PATCH("/:id/status", controllers.UpdateDeviceStatus)

			devices.POST("/:id/sensor-data", controllers.UploadSensorData)
			devices.GET("/:id/sensor-data/latest", controllers.GetLatestSensorData)
			devices.POST("/:id/weather-data", controllers.UploadWeatherData)
		}

		data := api.Group("/data")
		{
			data.GET("/sensor", controllers.GetSensorData)
			data.GET("/weather", controllers.GetWeatherData)
			data.GET("/weather/latest", controllers.GetLatestWeatherData)
		}

		irrigation := api.Group("/irrigation")
		{
			irrigation.POST("/valves/:id/start", controllers.StartIrrigation)
			irrigation.POST("/valves/:id/stop", controllers.StopIrrigation)
			irrigation.GET("/valves/:id/status", controllers.GetValveStatus)
			irrigation.GET("/records", controllers.GetIrrigationRecords)

			irrigation.GET("/schedules", controllers.GetSchedules)
			irrigation.POST("/schedules", controllers.CreateSchedule)
			irrigation.PUT("/schedules/:id", controllers.UpdateSchedule)
			irrigation.DELETE("/schedules/:id", controllers.DeleteSchedule)
		}

		alerts := api.Group("/alerts")
		{
			alerts.GET("", controllers.GetAlerts)
			alerts.GET("/stats", controllers.GetAlertStats)
			alerts.POST("/:id/resolve", controllers.ResolveAlert)
		}

		api.GET("/ws", controllers.WebSocketHandler(wsHub))
	}

	return r
}
