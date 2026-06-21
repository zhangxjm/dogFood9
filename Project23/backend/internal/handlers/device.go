package handlers

import (
	"backend/internal/models"
	"backend/internal/utils"
	"backend/pkg/database"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GetDeviceList 获取设备列表
func GetDeviceList(c *gin.Context) {
	var devices []models.Device
	query := database.DB

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	if deviceType := c.Query("type"); deviceType != "" {
		query = query.Where("type = ?", deviceType)
	}
	if location := c.Query("location"); location != "" {
		query = query.Where("location LIKE ?", "%"+location+"%")
	}

	if err := query.Find(&devices).Error; err != nil {
		utils.FailInternalError(c, "获取设备列表失败："+err.Error())
		return
	}

	utils.Success(c, devices)
}

// GetDevice 获取单个设备详情
func GetDevice(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的设备ID")
		return
	}

	var device models.Device
	if err := database.DB.First(&device, uint(id)).Error; err != nil {
		utils.FailNotFound(c, "设备不存在")
		return
	}

	utils.Success(c, device)
}

// CreateDevice 创建设备
func CreateDevice(c *gin.Context) {
	var device models.Device
	if err := c.ShouldBindJSON(&device); err != nil {
		utils.FailBadRequest(c, "参数错误："+err.Error())
		return
	}

	if device.InstallDate.IsZero() {
		device.InstallDate = time.Now()
	}
	if device.LastMaintain.IsZero() {
		device.LastMaintain = time.Now()
	}

	if err := database.DB.Create(&device).Error; err != nil {
		utils.FailInternalError(c, "创建设备失败："+err.Error())
		return
	}

	utils.AppLogger.Infof("创建设备成功：%s(ID:%d)", device.Name, device.ID)
	utils.Success(c, device)
}

// UpdateDevice 更新设备
func UpdateDevice(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的设备ID")
		return
	}

	var device models.Device
	if err := database.DB.First(&device, uint(id)).Error; err != nil {
		utils.FailNotFound(c, "设备不存在")
		return
	}

	var updateData models.Device
	if err := c.ShouldBindJSON(&updateData); err != nil {
		utils.FailBadRequest(c, "参数错误："+err.Error())
		return
	}

	if err := database.DB.Model(&device).Updates(updateData).Error; err != nil {
		utils.FailInternalError(c, "更新设备失败："+err.Error())
		return
	}

	database.DB.First(&device, uint(id))
	utils.AppLogger.Infof("更新设备成功：%s(ID:%d)", device.Name, device.ID)
	utils.Success(c, device)
}

// DeleteDevice 删除设备
func DeleteDevice(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的设备ID")
		return
	}

	var device models.Device
	if err := database.DB.First(&device, uint(id)).Error; err != nil {
		utils.FailNotFound(c, "设备不存在")
		return
	}

	if err := database.DB.Delete(&device).Error; err != nil {
		utils.FailInternalError(c, "删除设备失败："+err.Error())
		return
	}

	utils.AppLogger.Infof("删除设备成功：%s(ID:%d)", device.Name, device.ID)
	utils.Success(c, nil)
}
