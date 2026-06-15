package models

import (
	"time"
)

type Warehouse struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:100;not null" json:"name"`
	Address   string    `gorm:"size:255;not null" json:"address"`
	Latitude  float64   `gorm:"not null" json:"latitude"`
	Longitude float64   `gorm:"not null" json:"longitude"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Driver struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:50;not null" json:"name"`
	Phone     string    `gorm:"size:20" json:"phone"`
	Status    string    `gorm:"size:20;default:'空闲'" json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Vehicle struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	PlateNumber  string    `gorm:"size:20;not null;unique" json:"plate_number"`
	Type         string    `gorm:"size:50" json:"type"`
	Capacity     float64   `gorm:"default:1000" json:"capacity"`
	Status       string    `gorm:"size:20;default:'空闲'" json:"status"`
	CurrentLat   float64   `gorm:"default:0" json:"current_lat"`
	CurrentLng   float64   `gorm:"default:0" json:"current_lng"`
	DriverID     *uint     `json:"driver_id"`
	Driver       *Driver   `gorm:"foreignKey:DriverID" json:"driver,omitempty"`
	WarehouseID  uint      `json:"warehouse_id"`
	Warehouse    Warehouse `gorm:"foreignKey:WarehouseID" json:"warehouse"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Order struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	OrderNo      string    `gorm:"size:50;not null;unique" json:"order_no"`
	CustomerName string    `gorm:"size:100;not null" json:"customer_name"`
	Address      string    `gorm:"size:255;not null" json:"address"`
	Latitude     float64   `gorm:"not null" json:"latitude"`
	Longitude    float64   `gorm:"not null" json:"longitude"`
	Weight       float64   `gorm:"default:0" json:"weight"`
	Status       string    `gorm:"size:20;default:'待配送'" json:"status"`
	Priority     int       `gorm:"default:1" json:"priority"`
	WarehouseID  uint      `json:"warehouse_id"`
	Warehouse    Warehouse `gorm:"foreignKey:WarehouseID" json:"warehouse"`
	VehicleID    *uint     `json:"vehicle_id"`
	Vehicle      *Vehicle  `gorm:"foreignKey:VehicleID" json:"vehicle,omitempty"`
	Sequence     int       `gorm:"default:0" json:"sequence"`
	DeliveredAt  *time.Time `json:"delivered_at"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type DeliveryRoute struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	VehicleID   uint      `json:"vehicle_id"`
	Vehicle     Vehicle   `gorm:"foreignKey:VehicleID" json:"vehicle"`
	WarehouseID uint      `json:"warehouse_id"`
	Warehouse   Warehouse `gorm:"foreignKey:WarehouseID" json:"warehouse"`
	TotalDistance float64 `gorm:"default:0" json:"total_distance"`
	TotalOrders int     `gorm:"default:0" json:"total_orders"`
	Status      string    `gorm:"size:20;default:'待执行'" json:"status"`
	StartedAt   *time.Time `json:"started_at"`
	CompletedAt *time.Time `json:"completed_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type RoutePoint struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	RouteID        uint      `json:"route_id"`
	OrderID        *uint     `json:"order_id"`
	Order          *Order    `gorm:"foreignKey:OrderID" json:"order,omitempty"`
	PointType      string    `gorm:"size:20" json:"point_type"`
	Latitude       float64   `json:"latitude"`
	Longitude      float64   `json:"longitude"`
	Sequence       int       `json:"sequence"`
	ArrivalTime    *time.Time `json:"arrival_time"`
}
