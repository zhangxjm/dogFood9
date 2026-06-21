package handlers

import (
	"backend/internal/models"
	"backend/internal/utils"
	"backend/pkg/database"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GetMaintenanceRecordList 获取维护记录列表
func GetMaintenanceRecordList(c *gin.Context) {
	var records []models.MaintenanceRecord
	query := database.DB

	if deviceIDStr := c.Query("device_id"); deviceIDStr != "" {
		deviceID, err := strconv.ParseUint(deviceIDStr, 10, 32)
		if err == nil {
			query = query.Where("device_id = ?", uint(deviceID))
		}
	}

	if maintainType := c.Query("maintain_type"); maintainType != "" {
		query = query.Where("maintain_type = ?", maintainType)
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}

	var total int64
	query.Model(&models.MaintenanceRecord{}).Count(&total)

	offset := (page - 1) * pageSize
	query = query.Offset(offset).Limit(pageSize)

	if err := query.Order("start_time DESC").Find(&records).Error; err != nil {
		utils.FailInternalError(c, "获取维护记录列表失败："+err.Error())
		return
	}

	utils.Success(c, gin.H{
		"list":     records,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

// GetMaintenanceRecord 获取单个维护记录
func GetMaintenanceRecord(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的记录ID")
		return
	}

	var record models.MaintenanceRecord
	if err := database.DB.First(&record, uint(id)).Error; err != nil {
		utils.FailNotFound(c, "维护记录不存在")
		return
	}

	utils.Success(c, record)
}

// CreateMaintenanceRecord 创建维护记录
func CreateMaintenanceRecord(c *gin.Context) {
	var record models.MaintenanceRecord
	if err := c.ShouldBindJSON(&record); err != nil {
		utils.FailBadRequest(c, "参数错误："+err.Error())
		return
	}

	if record.StartTime.IsZero() {
		record.StartTime = time.Now()
	}
	if record.EndTime.IsZero() {
		record.EndTime = time.Now()
	}

	if err := database.DB.Create(&record).Error; err != nil {
		utils.FailInternalError(c, "创建维护记录失败："+err.Error())
		return
	}

	utils.AppLogger.Infof("创建维护记录成功：设备ID=%d 类型=%s", record.DeviceID, record.MaintainType)
	utils.Success(c, record)
}

// UpdateMaintenanceRecord 更新维护记录
func UpdateMaintenanceRecord(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的记录ID")
		return
	}

	var record models.MaintenanceRecord
	if err := database.DB.First(&record, uint(id)).Error; err != nil {
		utils.FailNotFound(c, "维护记录不存在")
		return
	}

	var updateData models.MaintenanceRecord
	if err := c.ShouldBindJSON(&updateData); err != nil {
		utils.FailBadRequest(c, "参数错误："+err.Error())
		return
	}

	if err := database.DB.Model(&record).Updates(updateData).Error; err != nil {
		utils.FailInternalError(c, "更新维护记录失败："+err.Error())
		return
	}

	database.DB.First(&record, uint(id))
	utils.Success(c, record)
}

// DeleteMaintenanceRecord 删除维护记录
func DeleteMaintenanceRecord(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的记录ID")
		return
	}

	if err := database.DB.Delete(&models.MaintenanceRecord{}, uint(id)).Error; err != nil {
		utils.FailInternalError(c, "删除维护记录失败："+err.Error())
		return
	}

	utils.Success(c, nil)
}

// GetMaintenancePlanList 获取维护计划列表
func GetMaintenancePlanList(c *gin.Context) {
	var plans []models.MaintenancePlan
	query := database.DB

	if deviceIDStr := c.Query("device_id"); deviceIDStr != "" {
		deviceID, err := strconv.ParseUint(deviceIDStr, 10, 32)
		if err == nil {
			query = query.Where("device_id = ?", uint(deviceID))
		}
	}

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}

	var total int64
	query.Model(&models.MaintenancePlan{}).Count(&total)

	offset := (page - 1) * pageSize
	query = query.Offset(offset).Limit(pageSize)

	if err := query.Order("next_maintain_time ASC").Find(&plans).Error; err != nil {
		utils.FailInternalError(c, "获取维护计划列表失败："+err.Error())
		return
	}

	utils.Success(c, gin.H{
		"list":     plans,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

// GetMaintenancePlan 获取单个维护计划
func GetMaintenancePlan(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的计划ID")
		return
	}

	var plan models.MaintenancePlan
	if err := database.DB.First(&plan, uint(id)).Error; err != nil {
		utils.FailNotFound(c, "维护计划不存在")
		return
	}

	utils.Success(c, plan)
}

// CreateMaintenancePlan 创建维护计划
func CreateMaintenancePlan(c *gin.Context) {
	var plan models.MaintenancePlan
	if err := c.ShouldBindJSON(&plan); err != nil {
		utils.FailBadRequest(c, "参数错误："+err.Error())
		return
	}

	if plan.NextMaintainTime.IsZero() {
		plan.NextMaintainTime = time.Now().AddDate(0, 0, 7)
	}
	if plan.Status == "" {
		plan.Status = "待执行"
	}

	if err := database.DB.Create(&plan).Error; err != nil {
		utils.FailInternalError(c, "创建维护计划失败："+err.Error())
		return
	}

	utils.AppLogger.Infof("创建维护计划成功：%s", plan.PlanName)
	utils.Success(c, plan)
}

// UpdateMaintenancePlan 更新维护计划
func UpdateMaintenancePlan(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的计划ID")
		return
	}

	var plan models.MaintenancePlan
	if err := database.DB.First(&plan, uint(id)).Error; err != nil {
		utils.FailNotFound(c, "维护计划不存在")
		return
	}

	var updateData models.MaintenancePlan
	if err := c.ShouldBindJSON(&updateData); err != nil {
		utils.FailBadRequest(c, "参数错误："+err.Error())
		return
	}

	if err := database.DB.Model(&plan).Updates(updateData).Error; err != nil {
		utils.FailInternalError(c, "更新维护计划失败："+err.Error())
		return
	}

	database.DB.First(&plan, uint(id))
	utils.Success(c, plan)
}

// DeleteMaintenancePlan 删除维护计划
func DeleteMaintenancePlan(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的计划ID")
		return
	}

	if err := database.DB.Delete(&models.MaintenancePlan{}, uint(id)).Error; err != nil {
		utils.FailInternalError(c, "删除维护计划失败："+err.Error())
		return
	}

	utils.Success(c, nil)
}
