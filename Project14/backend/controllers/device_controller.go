package controllers

import (
	"smart-irrigation/models"
	"smart-irrigation/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetDevices(c *gin.Context) {
	deviceType := c.Query("type")

	var devices []models.Device
	var err error

	if deviceType != "" {
		devices, err = models.GetDevicesByType(models.DeviceType(deviceType))
	} else {
		devices, err = models.GetAllDevices()
	}

	if err != nil {
		utils.InternalError(c, "Failed to get devices")
		return
	}

	utils.Success(c, devices)
}

func GetDevice(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid device ID")
		return
	}

	device, err := models.GetDeviceByID(uint(id))
	if err != nil {
		utils.NotFound(c, "Device not found")
		return
	}

	utils.Success(c, device)
}

func CreateDevice(c *gin.Context) {
	var device models.Device
	if err := c.ShouldBindJSON(&device); err != nil {
		utils.BadRequest(c, "Invalid request body")
		return
	}

	if err := models.CreateDevice(&device); err != nil {
		utils.InternalError(c, "Failed to create device")
		return
	}

	utils.Success(c, device)
}

func UpdateDevice(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid device ID")
		return
	}

	var device models.Device
	if err := c.ShouldBindJSON(&device); err != nil {
		utils.BadRequest(c, "Invalid request body")
		return
	}

	device.ID = uint(id)
	if err := models.UpdateDevice(&device); err != nil {
		utils.InternalError(c, "Failed to update device")
		return
	}

	utils.Success(c, device)
}

func DeleteDevice(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid device ID")
		return
	}

	if err := models.DeleteDevice(uint(id)); err != nil {
		utils.InternalError(c, "Failed to delete device")
		return
	}

	utils.Success(c, nil)
}

func UpdateDeviceStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid device ID")
		return
	}

	var body struct {
		Status models.DeviceStatus `json:"status"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "Invalid request body")
		return
	}

	if err := models.UpdateDeviceStatus(uint(id), body.Status); err != nil {
		utils.InternalError(c, "Failed to update device status")
		return
	}

	utils.Success(c, nil)
}
