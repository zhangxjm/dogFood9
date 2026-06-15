package handlers

import (
	"delivery-optimizer/database"
	"delivery-optimizer/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetVehicles(c *gin.Context) {
	var vehicles []models.Vehicle
	query := database.DB.Preload("Driver").Preload("Warehouse")
	if warehouseID := c.Query("warehouse_id"); warehouseID != "" {
		query = query.Where("warehouse_id = ?", warehouseID)
	}
	query.Find(&vehicles)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "success", Data: vehicles})
}

func GetVehicle(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var vehicle models.Vehicle
	if err := database.DB.Preload("Driver").Preload("Warehouse").First(&vehicle, id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "车辆不存在"})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 0, Message: "success", Data: vehicle})
}

func CreateVehicle(c *gin.Context) {
	var vehicle models.Vehicle
	if err := c.ShouldBindJSON(&vehicle); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}
	if vehicle.Status == "" {
		vehicle.Status = "空闲"
	}
	if vehicle.Capacity == 0 {
		vehicle.Capacity = 1000
	}
	database.DB.Create(&vehicle)
	database.DB.Preload("Driver").Preload("Warehouse").First(&vehicle, vehicle.ID)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "创建成功", Data: vehicle})
}

func UpdateVehicle(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var vehicle models.Vehicle
	if err := database.DB.First(&vehicle, id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "车辆不存在"})
		return
	}
	if err := c.ShouldBindJSON(&vehicle); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}
	database.DB.Save(&vehicle)
	database.DB.Preload("Driver").Preload("Warehouse").First(&vehicle, id)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "更新成功", Data: vehicle})
}

func DeleteVehicle(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	database.DB.Delete(&models.Vehicle{}, id)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "删除成功"})
}

func UpdateVehicleLocation(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var vehicle models.Vehicle
	if err := database.DB.First(&vehicle, id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "车辆不存在"})
		return
	}

	var req struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}

	vehicle.CurrentLat = req.Latitude
	vehicle.CurrentLng = req.Longitude
	database.DB.Save(&vehicle)

	c.JSON(http.StatusOK, Response{Code: 0, Message: "位置更新成功", Data: vehicle})
}
