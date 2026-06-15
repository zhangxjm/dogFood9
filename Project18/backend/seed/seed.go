package seed

import (
	"delivery-optimizer/database"
	"delivery-optimizer/models"
	"fmt"
	"log"
	"math/rand"
	"time"
)

func SeedData() {
	var warehouseCount int64
	database.DB.Model(&models.Warehouse{}).Count(&warehouseCount)
	if warehouseCount > 0 {
		log.Println("Data already seeded, skipping...")
		return
	}

	rand.Seed(time.Now().UnixNano())

	warehouses := []models.Warehouse{
		{
			Name:      "北京中心仓库",
			Address:   "北京市朝阳区建国路88号",
			Latitude:  39.9042,
			Longitude: 116.4074,
		},
		{
			Name:      "上海浦东仓库",
			Address:   "上海市浦东新区世纪大道100号",
			Latitude:  31.2304,
			Longitude: 121.4737,
		},
		{
			Name:      "广州白云仓库",
			Address:   "广州市白云区机场路100号",
			Latitude:  23.1291,
			Longitude: 113.2644,
		},
	}

	for i := range warehouses {
		database.DB.Create(&warehouses[i])
	}

	drivers := []models.Driver{
		{Name: "张伟", Phone: "13800138001", Status: "空闲"},
		{Name: "王芳", Phone: "13800138002", Status: "空闲"},
		{Name: "李强", Phone: "13800138003", Status: "空闲"},
		{Name: "刘洋", Phone: "13800138004", Status: "空闲"},
		{Name: "陈静", Phone: "13800138005", Status: "空闲"},
		{Name: "杨帆", Phone: "13800138006", Status: "空闲"},
	}

	for i := range drivers {
		database.DB.Create(&drivers[i])
	}

	vehicles := []models.Vehicle{
		{PlateNumber: "京A12345", Type: "小型货车", Capacity: 500, Status: "空闲", DriverID: &drivers[0].ID, WarehouseID: warehouses[0].ID, CurrentLat: warehouses[0].Latitude, CurrentLng: warehouses[0].Longitude},
		{PlateNumber: "京A67890", Type: "中型货车", Capacity: 1000, Status: "空闲", DriverID: &drivers[1].ID, WarehouseID: warehouses[0].ID, CurrentLat: warehouses[0].Latitude, CurrentLng: warehouses[0].Longitude},
		{PlateNumber: "沪B12345", Type: "小型货车", Capacity: 500, Status: "空闲", DriverID: &drivers[2].ID, WarehouseID: warehouses[1].ID, CurrentLat: warehouses[1].Latitude, CurrentLng: warehouses[1].Longitude},
		{PlateNumber: "沪B67890", Type: "中型货车", Capacity: 1000, Status: "空闲", DriverID: &drivers[3].ID, WarehouseID: warehouses[1].ID, CurrentLat: warehouses[1].Latitude, CurrentLng: warehouses[1].Longitude},
		{PlateNumber: "粤C12345", Type: "小型货车", Capacity: 500, Status: "空闲", DriverID: &drivers[4].ID, WarehouseID: warehouses[2].ID, CurrentLat: warehouses[2].Latitude, CurrentLng: warehouses[2].Longitude},
		{PlateNumber: "粤C67890", Type: "大型货车", Capacity: 2000, Status: "空闲", DriverID: &drivers[5].ID, WarehouseID: warehouses[2].ID, CurrentLat: warehouses[2].Latitude, CurrentLng: warehouses[2].Longitude},
	}

	for i := range vehicles {
		database.DB.Create(&vehicles[i])
	}

	customerNames := []string{
		"沃尔玛超市", "家乐福", "大润发", "永辉超市", "物美超市",
		"盒马鲜生", "711便利店", "全家便利店", "罗森便利店", "便利蜂",
		"京东便利店", "天猫小店", "苏宁小店", "美宜佳", "天福便利店",
		"华润万家", "卜蜂莲花", "麦德龙", "山姆会员店", "Costco",
	}

	streets := []string{
		"人民路", "中山路", "解放路", "建国路", "和平路",
		"文化路", "科技路", "建设路", "长江路", "黄河路",
	}

	orderStatuses := []string{"待配送", "配送中", "已送达"}

	for wIdx, warehouse := range warehouses {
		baseLat := warehouse.Latitude
		baseLng := warehouse.Longitude

		for i := 0; i < 15; i++ {
			orderNo := fmt.Sprintf("ORD%04d%04d", wIdx+1, i+1)
			customerIdx := rand.Intn(len(customerNames))
			streetIdx := rand.Intn(len(streets))
			streetNum := rand.Intn(200) + 1

			latOffset := (rand.Float64() - 0.5) * 0.1
			lngOffset := (rand.Float64() - 0.5) * 0.1

			status := "待配送"
			if i < 3 {
				status = orderStatuses[rand.Intn(3)]
			}

			order := models.Order{
				OrderNo:      orderNo,
				CustomerName: fmt.Sprintf("%s(%s店)", customerNames[customerIdx], streets[streetIdx]),
				Address:      fmt.Sprintf("%s%s号%s", streets[streetIdx], streetNum, customerNames[customerIdx]),
				Latitude:     baseLat + latOffset,
				Longitude:    baseLng + lngOffset,
				Weight:       float64(rand.Intn(100)+10) * 1.0,
				Status:       status,
				Priority:     rand.Intn(3) + 1,
				WarehouseID:  warehouse.ID,
			}

			if status == "配送中" || status == "已送达" {
				vehicleIdx := wIdx * 2
				if vehicleIdx < len(vehicles) {
					order.VehicleID = &vehicles[vehicleIdx].ID
					order.Sequence = i + 1
				}
			}

			if status == "已送达" {
				now := time.Now().Add(-time.Duration(rand.Intn(120)) * time.Minute)
				order.DeliveredAt = &now
			}

			database.DB.Create(&order)
		}
	}

	log.Println("Seed data created successfully")
}
