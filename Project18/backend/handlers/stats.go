package handlers

import (
	"delivery-optimizer/database"
	"delivery-optimizer/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Statistics struct {
	TotalWarehouses int64 `json:"total_warehouses"`
	TotalDrivers    int64 `json:"total_drivers"`
	TotalVehicles   int64 `json:"total_vehicles"`
	TotalOrders     int64 `json:"total_orders"`
	PendingOrders   int64 `json:"pending_orders"`
	DeliveringOrders int64 `json:"delivering_orders"`
	DeliveredOrders int64 `json:"delivered_orders"`
	IdleVehicles    int64 `json:"idle_vehicles"`
	DeliveringVehicles int64 `json:"delivering_vehicles"`
	IdleDrivers     int64 `json:"idle_drivers"`
	WorkingDrivers  int64 `json:"working_drivers"`
}

func GetStatistics(c *gin.Context) {
	var stats Statistics

	database.DB.Model(&models.Warehouse{}).Count(&stats.TotalWarehouses)
	database.DB.Model(&models.Driver{}).Count(&stats.TotalDrivers)
	database.DB.Model(&models.Vehicle{}).Count(&stats.TotalVehicles)
	database.DB.Model(&models.Order{}).Count(&stats.TotalOrders)

	database.DB.Model(&models.Order{}).Where("status = ?", "待配送").Count(&stats.PendingOrders)
	database.DB.Model(&models.Order{}).Where("status = ?", "配送中").Count(&stats.DeliveringOrders)
	database.DB.Model(&models.Order{}).Where("status = ?", "已送达").Count(&stats.DeliveredOrders)

	database.DB.Model(&models.Vehicle{}).Where("status = ?", "空闲").Count(&stats.IdleVehicles)
	database.DB.Model(&models.Vehicle{}).Where("status = ?", "配送中").Count(&stats.DeliveringVehicles)

	database.DB.Model(&models.Driver{}).Where("status = ?", "空闲").Count(&stats.IdleDrivers)
	database.DB.Model(&models.Driver{}).Where("status = ?", "工作中").Count(&stats.WorkingDrivers)

	c.JSON(http.StatusOK, Response{Code: 0, Message: "success", Data: stats})
}

type TrackingData struct {
	Vehicles []VehicleTracking `json:"vehicles"`
	Orders   []models.Order    `json:"orders"`
}

type VehicleTracking struct {
	ID         uint           `json:"id"`
	PlateNumber string         `json:"plate_number"`
	Type       string         `json:"type"`
	Status     string         `json:"status"`
	CurrentLat float64        `json:"current_lat"`
	CurrentLng float64        `json:"current_lng"`
	Driver     *models.Driver `json:"driver"`
	Warehouse  models.Warehouse `json:"warehouse"`
	Orders     []models.Order `json:"orders"`
}

func GetTrackingData(c *gin.Context) {
	var data TrackingData

	var vehicles []models.Vehicle
	database.DB.Preload("Driver").Preload("Warehouse").Find(&vehicles)

	for _, v := range vehicles {
		var orders []models.Order
		if v.Status == "配送中" {
			database.DB.Where("vehicle_id = ?", v.ID).Order("sequence").Find(&orders)
		}
		data.Vehicles = append(data.Vehicles, VehicleTracking{
			ID:         v.ID,
			PlateNumber: v.PlateNumber,
			Type:       v.Type,
			Status:     v.Status,
			CurrentLat: v.CurrentLat,
			CurrentLng: v.CurrentLng,
			Driver:     v.Driver,
			Warehouse:  v.Warehouse,
			Orders:     orders,
		})
	}

	var pendingOrders []models.Order
	database.DB.Where("status = ? OR status = ?", "待配送", "配送中").Preload("Warehouse").Find(&pendingOrders)
	data.Orders = pendingOrders

	c.JSON(http.StatusOK, Response{Code: 0, Message: "success", Data: data})
}
