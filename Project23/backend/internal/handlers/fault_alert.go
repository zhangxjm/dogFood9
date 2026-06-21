package handlers

import (
	"backend/internal/models"
	"backend/internal/utils"
	"backend/pkg/database"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GetFaultAlertList 获取故障预警列表
func GetFaultAlertList(c *gin.Context) {
	var alerts []models.FaultAlert
	query := database.DB

	if deviceIDStr := c.Query("device_id"); deviceIDStr != "" {
		deviceID, err := strconv.ParseUint(deviceIDStr, 10, 32)
		if err == nil {
			query = query.Where("device_id = ?", uint(deviceID))
		}
	}

	if level := c.Query("level"); level != "" {
		query = query.Where("level = ?", level)
	}

	if isResolved := c.Query("is_resolved"); isResolved != "" {
		resolved, err := strconv.ParseBool(isResolved)
		if err == nil {
			query = query.Where("is_resolved = ?", resolved)
		}
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
	query.Model(&models.FaultAlert{}).Count(&total)

	offset := (page - 1) * pageSize
	query = query.Offset(offset).Limit(pageSize)

	if err := query.Order("timestamp DESC").Find(&alerts).Error; err != nil {
		utils.FailInternalError(c, "获取故障预警列表失败："+err.Error())
		return
	}

	utils.Success(c, gin.H{
		"list":     alerts,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
	})
}

// GetFaultAlert 获取单个故障预警详情
func GetFaultAlert(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的预警ID")
		return
	}

	var alert models.FaultAlert
	if err := database.DB.First(&alert, uint(id)).Error; err != nil {
		utils.FailNotFound(c, "故障预警不存在")
		return
	}

	utils.Success(c, alert)
}

// CreateFaultAlert 创建故障预警
func CreateFaultAlert(c *gin.Context) {
	var alert models.FaultAlert
	if err := c.ShouldBindJSON(&alert); err != nil {
		utils.FailBadRequest(c, "参数错误："+err.Error())
		return
	}

	if alert.Timestamp.IsZero() {
		alert.Timestamp = time.Now()
	}

	if err := database.DB.Create(&alert).Error; err != nil {
		utils.FailInternalError(c, "创建故障预警失败："+err.Error())
		return
	}

	utils.AppLogger.Warnf("新的故障预警：设备ID=%d 类型=%s 级别=%s",
		alert.DeviceID, alert.AlertType, alert.Level)
	utils.Success(c, alert)
}

// ResolveFaultAlert 确认/解决故障预警
func ResolveFaultAlert(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的预警ID")
		return
	}

	var alert models.FaultAlert
	if err := database.DB.First(&alert, uint(id)).Error; err != nil {
		utils.FailNotFound(c, "故障预警不存在")
		return
	}

	alert.IsResolved = true
	if err := database.DB.Save(&alert).Error; err != nil {
		utils.FailInternalError(c, "更新故障预警状态失败："+err.Error())
		return
	}

	utils.AppLogger.Infof("故障预警已解决：ID=%d", alert.ID)
	utils.Success(c, alert)
}

// DeleteFaultAlert 删除故障预警
func DeleteFaultAlert(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的预警ID")
		return
	}

	if err := database.DB.Delete(&models.FaultAlert{}, uint(id)).Error; err != nil {
		utils.FailInternalError(c, "删除故障预警失败："+err.Error())
		return
	}

	utils.Success(c, nil)
}
