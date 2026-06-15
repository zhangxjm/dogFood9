package handlers

import (
	"delivery-optimizer/database"
	"delivery-optimizer/genetic"
	"delivery-optimizer/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type OptimizeRequest struct {
	WarehouseID uint `json:"warehouse_id"`
	Generations int  `json:"generations"`
	Population  int  `json:"population"`
}

type OptimizedRoute struct {
	VehicleID     uint           `json:"vehicle_id"`
	Vehicle       models.Vehicle `json:"vehicle"`
	Orders        []models.Order `json:"orders"`
	TotalDistance float64        `json:"total_distance"`
	TotalWeight   float64        `json:"total_weight"`
	RoutePoints   []RoutePoint   `json:"route_points"`
}

type RoutePoint struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Type      string  `json:"type"`
	OrderID   *uint   `json:"order_id,omitempty"`
	Sequence  int     `json:"sequence"`
}

func OptimizeRoutes(c *gin.Context) {
	var req OptimizeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}

	var warehouse models.Warehouse
	if err := database.DB.First(&warehouse, req.WarehouseID).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "仓库不存在"})
		return
	}

	var orders []models.Order
	database.DB.Where("warehouse_id = ? AND status = ?", req.WarehouseID, "待配送").Find(&orders)

	if len(orders) == 0 {
		c.JSON(http.StatusOK, Response{Code: 0, Message: "没有待配送订单", Data: []OptimizedRoute{}})
		return
	}

	var vehicles []models.Vehicle
	database.DB.Preload("Driver").Where("warehouse_id = ? AND status = ?", req.WarehouseID, "空闲").Find(&vehicles)

	if len(vehicles) == 0 {
		c.JSON(http.StatusOK, Response{Code: 0, Message: "没有可用车辆", Data: []OptimizedRoute{}})
		return
	}

	optimized := genetic.OptimizeRoutes(warehouse, orders, vehicles, req.Generations, req.Population)

	var routes []OptimizedRoute
	for vehicleID, vOrders := range optimized {
		var vehicle models.Vehicle
		database.DB.Preload("Driver").First(&vehicle, vehicleID)

		totalDistance := 0.0
		totalWeight := 0.0
		var points []RoutePoint

		points = append(points, RoutePoint{
			Latitude:  warehouse.Latitude,
			Longitude: warehouse.Longitude,
			Type:      "warehouse",
			Sequence:  0,
		})

		prevLat := warehouse.Latitude
		prevLng := warehouse.Longitude

		for seq, order := range vOrders {
			dist := genetic.Haversine(prevLat, prevLng, order.Latitude, order.Longitude)
			totalDistance += dist
			totalWeight += order.Weight

			orderID := order.ID
			points = append(points, RoutePoint{
				Latitude:  order.Latitude,
				Longitude: order.Longitude,
				Type:      "order",
				OrderID:   &orderID,
				Sequence:  seq + 1,
			})

			prevLat = order.Latitude
			prevLng = order.Longitude
		}

		totalDistance += genetic.Haversine(prevLat, prevLng, warehouse.Latitude, warehouse.Longitude)

		routes = append(routes, OptimizedRoute{
			VehicleID:     vehicleID,
			Vehicle:       vehicle,
			Orders:        vOrders,
			TotalDistance: totalDistance,
			TotalWeight:   totalWeight,
			RoutePoints:   points,
		})
	}

	c.JSON(http.StatusOK, Response{Code: 0, Message: "优化成功", Data: routes})
}

func SaveRoutes(c *gin.Context) {
	var routes []OptimizedRoute
	if err := c.ShouldBindJSON(&routes); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}

	tx := database.DB.Begin()

	for _, route := range routes {
		deliveryRoute := models.DeliveryRoute{
			VehicleID:     route.VehicleID,
			WarehouseID:   0,
			TotalDistance: route.TotalDistance,
			TotalOrders:   len(route.Orders),
			Status:        "待执行",
		}

		for _, p := range route.RoutePoints {
			if p.Type == "warehouse" {
				var warehouse models.Warehouse
				tx.Where("latitude = ? AND longitude = ?", p.Latitude, p.Longitude).First(&warehouse)
				if warehouse.ID > 0 {
					deliveryRoute.WarehouseID = warehouse.ID
				}
				break
			}
		}

		if err := tx.Create(&deliveryRoute).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, Response{Code: 500, Message: "保存路线失败"})
			return
		}

		for _, p := range route.RoutePoints {
			rp := models.RoutePoint{
				RouteID:   deliveryRoute.ID,
				OrderID:   p.OrderID,
				PointType: p.Type,
				Latitude:  p.Latitude,
				Longitude: p.Longitude,
				Sequence:  p.Sequence,
			}
			tx.Create(&rp)
		}

		for seq, order := range route.Orders {
			tx.Model(&models.Order{}).Where("id = ?", order.ID).Updates(map[string]interface{}{
				"vehicle_id": route.VehicleID,
				"sequence":   seq + 1,
				"status":     "配送中",
			})
		}

		tx.Model(&models.Vehicle{}).Where("id = ?", route.VehicleID).Update("status", "配送中")
	}

	tx.Commit()
	c.JSON(http.StatusOK, Response{Code: 0, Message: "路线保存成功"})
}

func GetDeliveryRoutes(c *gin.Context) {
	var routes []models.DeliveryRoute
	query := database.DB.Preload("Vehicle.Driver").Preload("Warehouse")

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	query.Order("created_at desc").Find(&routes)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "success", Data: routes})
}

func GetRouteDetail(c *gin.Context) {
	id := c.Param("id")
	var route models.DeliveryRoute
	if err := database.DB.Preload("Vehicle.Driver").Preload("Warehouse").First(&route, id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "路线不存在"})
		return
	}

	var points []models.RoutePoint
	database.DB.Preload("Order").Where("route_id = ?", id).Order("sequence").Find(&points)

	c.JSON(http.StatusOK, Response{Code: 0, Message: "success", Data: gin.H{
		"route":  route,
		"points": points,
	}})
}

func StartRoute(c *gin.Context) {
	id := c.Param("id")
	var route models.DeliveryRoute
	if err := database.DB.First(&route, id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "路线不存在"})
		return
	}

	now := time.Now()
	route.Status = "执行中"
	route.StartedAt = &now
	database.DB.Save(&route)

	c.JSON(http.StatusOK, Response{Code: 0, Message: "路线已启动", Data: route})
}

func CompleteRoute(c *gin.Context) {
	id := c.Param("id")
	var route models.DeliveryRoute
	if err := database.DB.First(&route, id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "路线不存在"})
		return
	}

	now := time.Now()
	route.Status = "已完成"
	route.CompletedAt = &now
	database.DB.Save(&route)

	database.DB.Model(&models.Order{}).Where("vehicle_id = ?", route.VehicleID).Where("status != ?", "已送达").Updates(map[string]interface{}{
		"status":       "已送达",
		"delivered_at": now,
	})

	database.DB.Model(&models.Vehicle{}).Where("id = ?", route.VehicleID).Update("status", "空闲")

	c.JSON(http.StatusOK, Response{Code: 0, Message: "路线已完成", Data: route})
}
