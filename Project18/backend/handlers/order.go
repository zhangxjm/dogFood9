package handlers

import (
	"delivery-optimizer/database"
	"delivery-optimizer/models"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func GetOrders(c *gin.Context) {
	var orders []models.Order
	query := database.DB.Preload("Warehouse").Preload("Vehicle.Driver")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if warehouseID := c.Query("warehouse_id"); warehouseID != "" {
		query = query.Where("warehouse_id = ?", warehouseID)
	}
	if vehicleID := c.Query("vehicle_id"); vehicleID != "" {
		query = query.Where("vehicle_id = ?", vehicleID)
	}

	query.Order("created_at desc").Find(&orders)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "success", Data: orders})
}

func GetOrder(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var order models.Order
	if err := database.DB.Preload("Warehouse").Preload("Vehicle.Driver").First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "订单不存在"})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 0, Message: "success", Data: order})
}

func CreateOrder(c *gin.Context) {
	var order models.Order
	if err := c.ShouldBindJSON(&order); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}
	if order.OrderNo == "" {
		order.OrderNo = fmt.Sprintf("ORD%d", time.Now().Unix())
	}
	if order.Status == "" {
		order.Status = "待配送"
	}
	if order.Priority == 0 {
		order.Priority = 1
	}
	database.DB.Create(&order)
	database.DB.Preload("Warehouse").Preload("Vehicle.Driver").First(&order, order.ID)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "创建成功", Data: order})
}

func UpdateOrder(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var order models.Order
	if err := database.DB.First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "订单不存在"})
		return
	}
	if err := c.ShouldBindJSON(&order); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}
	database.DB.Save(&order)
	database.DB.Preload("Warehouse").Preload("Vehicle.Driver").First(&order, id)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "更新成功", Data: order})
}

func DeleteOrder(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	database.DB.Delete(&models.Order{}, id)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "删除成功"})
}

func UpdateOrderStatus(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var order models.Order
	if err := database.DB.First(&order, id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "订单不存在"})
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}

	order.Status = req.Status
	if req.Status == "已送达" {
		now := time.Now()
		order.DeliveredAt = &now
	}
	database.DB.Save(&order)
	database.DB.Preload("Warehouse").Preload("Vehicle.Driver").First(&order, id)

	c.JSON(http.StatusOK, Response{Code: 0, Message: "状态更新成功", Data: order})
}
