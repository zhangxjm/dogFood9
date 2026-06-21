package handlers

import (
	"backend/internal/machine_learning"
	"backend/internal/models"
	"backend/internal/utils"
	"backend/pkg/database"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GetStatistics 获取统计概览数据
func GetStatistics(c *gin.Context) {
	var stats models.StatisticsData

	database.DB.Model(&models.Device{}).Count(&stats.TotalDevices)
	database.DB.Model(&models.Device{}).Where("status = ?", "运行中").Count(&stats.RunningDevices)
	database.DB.Model(&models.Device{}).Where("status = ?", "故障").Count(&stats.FaultDevices)
	database.DB.Model(&models.Device{}).Where("status = ?", "维护中").Count(&stats.MaintenanceDevices)
	database.DB.Model(&models.Device{}).Where("status = ?", "待机").Count(&stats.StandbyDevices)

	today := time.Now().Truncate(24 * time.Hour)
	database.DB.Model(&models.FaultAlert{}).Where("timestamp >= ?", today).Count(&stats.TodayAlerts)
	database.DB.Model(&models.FaultAlert{}).Where("is_resolved = ?", false).Count(&stats.UnresolvedAlerts)

	var totalCost float64
	database.DB.Model(&models.MaintenanceRecord{}).Select("COALESCE(SUM(cost), 0)").Scan(&totalCost)
	stats.TotalMaintainCost = totalCost

	database.DB.Model(&models.SparePartStock{}).Where("quantity <= min_stock").Count(&stats.LowStockCount)

	utils.Success(c, stats)
}

// GetDeviceStatusDistribution 获取设备状态分布
func GetDeviceStatusDistribution(c *gin.Context) {
	type StatusCount struct {
		Status string `json:"status"`
		Count  int64  `json:"count"`
	}

	var results []StatusCount
	database.DB.Model(&models.Device{}).
		Select("status, COUNT(*) as count").
		Group("status").
		Scan(&results)

	utils.Success(c, results)
}

// GetAlertTypeDistribution 获取告警类型分布
func GetAlertTypeDistribution(c *gin.Context) {
	type AlertCount struct {
		AlertType string `json:"alert_type"`
		Count     int64  `json:"count"`
	}

	var results []AlertCount
	database.DB.Model(&models.FaultAlert{}).
		Select("alert_type, COUNT(*) as count").
		Group("alert_type").
		Scan(&results)

	utils.Success(c, results)
}

// GetMaintenanceCostTrend 获取维护成本趋势（最近30天）
func GetMaintenanceCostTrend(c *gin.Context) {
	type DailyCost struct {
		Date  string  `json:"date"`
		Total float64 `json:"total"`
	}

	var results []DailyCost
	startDate := time.Now().AddDate(0, 0, -29)

	database.DB.Model(&models.MaintenanceRecord{}).
		Select("DATE(start_time) as date, COALESCE(SUM(cost), 0) as total").
		Where("start_time >= ?", startDate).
		Group("DATE(start_time)").
		Order("date ASC").
		Scan(&results)

	utils.Success(c, results)
}

// PredictDeviceFault 预测单台设备故障
func PredictDeviceFault(c *gin.Context) {
	deviceID, err := strconv.ParseUint(c.Param("device_id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的设备ID")
		return
	}

	var dataList []models.DeviceData
	if err := database.DB.Where("device_id = ?", uint(deviceID)).
		Order("timestamp ASC").
		Limit(100).
		Find(&dataList).Error; err != nil {
		utils.FailInternalError(c, "获取设备数据失败："+err.Error())
		return
	}

	if len(dataList) == 0 {
		utils.FailNotFound(c, "未找到设备运行数据")
		return
	}

	latestData := dataList[len(dataList)-1]
	result := machine_learning.GlobalPredictor.PredictDeviceFault(uint(deviceID), latestData, dataList)

	utils.Success(c, result)
}

// PredictAllDevices 预测所有设备故障
func PredictAllDevices(c *gin.Context) {
	var dataList []models.DeviceData
	if err := database.DB.Order("device_id ASC, timestamp ASC").
		Limit(1000).
		Find(&dataList).Error; err != nil {
		utils.FailInternalError(c, "获取设备数据失败："+err.Error())
		return
	}

	deviceDataMap := make(map[uint][]models.DeviceData)
	for _, data := range dataList {
		deviceDataMap[data.DeviceID] = append(deviceDataMap[data.DeviceID], data)
	}

	results := machine_learning.GlobalPredictor.BatchPredictDevices(deviceDataMap)

	utils.Success(c, gin.H{
		"total":   len(results),
		"results": results,
	})
}

// GetDeviceDataTrend 获取设备数据趋势
func GetDeviceDataTrend(c *gin.Context) {
	deviceID, err := strconv.ParseUint(c.Param("device_id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的设备ID")
		return
	}

	hoursStr := c.DefaultQuery("hours", "24")
	hours, err := strconv.Atoi(hoursStr)
	if err != nil {
		hours = 24
	}

	startTime := time.Now().Add(-time.Duration(hours) * time.Hour)

	var dataList []models.DeviceData
	if err := database.DB.Where("device_id = ? AND timestamp >= ?", uint(deviceID), startTime).
		Order("timestamp ASC").
		Find(&dataList).Error; err != nil {
		utils.FailInternalError(c, "获取设备数据失败："+err.Error())
		return
	}

	utils.Success(c, gin.H{
		"count": len(dataList),
		"data":  dataList,
	})
}
