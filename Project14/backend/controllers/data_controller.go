package controllers

import (
	"smart-irrigation/models"
	"smart-irrigation/utils"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func UploadSensorData(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid device ID")
		return
	}

	var data models.SensorData
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.BadRequest(c, "Invalid request body")
		return
	}

	data.DeviceID = uint(id)
	data.Timestamp = time.Now()
	data.CreatedAt = time.Now()

	if err := models.DB.Create(&data).Error; err != nil {
		utils.InternalError(c, "Failed to save sensor data")
		return
	}

	models.UpdateDeviceStatus(uint(id), models.DeviceStatusOnline)

	utils.Success(c, data)
}

func GetSensorData(c *gin.Context) {
	deviceID := c.Query("device_id")
	limit := 100

	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	var data []models.SensorData
	query := models.DB.Order("timestamp desc")

	if deviceID != "" {
		query = query.Where("device_id = ?", deviceID)
	}

	result := query.Limit(limit).Find(&data)
	if result.Error != nil {
		utils.InternalError(c, "Failed to get sensor data")
		return
	}

	utils.Success(c, data)
}

func GetLatestSensorData(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid device ID")
		return
	}

	var data models.SensorData
	result := models.DB.Where("device_id = ?", uint(id)).Order("timestamp desc").First(&data)
	if result.Error != nil {
		utils.NotFound(c, "No sensor data found")
		return
	}

	utils.Success(c, data)
}

func UploadWeatherData(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid device ID")
		return
	}

	var data models.WeatherData
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.BadRequest(c, "Invalid request body")
		return
	}

	data.DeviceID = uint(id)
	data.Timestamp = time.Now()
	data.CreatedAt = time.Now()

	if err := models.DB.Create(&data).Error; err != nil {
		utils.InternalError(c, "Failed to save weather data")
		return
	}

	models.UpdateDeviceStatus(uint(id), models.DeviceStatusOnline)

	utils.Success(c, data)
}

func GetWeatherData(c *gin.Context) {
	limit := 100
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	var data []models.WeatherData
	result := models.DB.Order("timestamp desc").Limit(limit).Find(&data)
	if result.Error != nil {
		utils.InternalError(c, "Failed to get weather data")
		return
	}

	utils.Success(c, data)
}

func GetLatestWeatherData(c *gin.Context) {
	var data models.WeatherData
	result := models.DB.Order("timestamp desc").First(&data)
	if result.Error != nil {
		utils.NotFound(c, "No weather data found")
		return
	}

	utils.Success(c, data)
}
