package handlers

import (
	"backend/internal/models"
	"backend/internal/utils"
	"backend/pkg/database"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GetDeviceDataList 获取设备数据列表
func GetDeviceDataList(c *gin.Context) {
	var dataList []models.DeviceData
	query := database.DB

	if deviceIDStr := c.Query("device_id"); deviceIDStr != "" {
		deviceID, err := strconv.ParseUint(deviceIDStr, 10, 32)
		if err == nil {
			query = query.Where("device_id = ?", uint(deviceID))
		}
	}

	if startTimeStr := c.Query("start_time"); startTimeStr != "" {
		if startTime, err := time.Parse(time.RFC3339, startTimeStr); err == nil {
			query = query.Where("timestamp >= ?", startTime)
		}
	}

	if endTimeStr := c.Query("end_time"); endTimeStr != "" {
		if endTime, err := time.Parse(time.RFC3339, endTimeStr); err == nil {
			query = query.Where("timestamp <= ?", endTime)
		}
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			query = query.Limit(limit)
		}
	}

	if err := query.Order("timestamp DESC").Find(&dataList).Error; err != nil {
		utils.FailInternalError(c, "获取设备数据失败："+err.Error())
		return
	}

	utils.Success(c, dataList)
}

// GetLatestDeviceData 获取设备最新数据
func GetLatestDeviceData(c *gin.Context) {
	deviceID, err := strconv.ParseUint(c.Param("device_id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的设备ID")
		return
	}

	var data models.DeviceData
	if err := database.DB.Where("device_id = ?", uint(deviceID)).Order("timestamp DESC").First(&data).Error; err != nil {
		utils.FailNotFound(c, "未找到设备数据")
		return
	}

	utils.Success(c, data)
}

// CollectDeviceData 采集设备数据（通过缓冲channel批量写入）
func CollectDeviceData(c *gin.Context) {
	var data models.DeviceData
	if err := c.ShouldBindJSON(&data); err != nil {
		utils.FailBadRequest(c, "参数错误："+err.Error())
		return
	}

	if data.Timestamp.IsZero() {
		data.Timestamp = time.Now()
	}

	select {
	case database.DataBuffer <- &data:
		utils.AppLogger.Infof("设备数据已加入缓冲区：设备ID=%d", data.DeviceID)
		utils.Success(c, gin.H{
			"message": "数据已接收，将批量写入",
			"data":    data,
		})
	default:
		utils.AppLogger.Warn("数据缓冲区已满，直接写入数据库")
		if err := database.DB.Create(&data).Error; err != nil {
			utils.FailInternalError(c, "写入数据失败："+err.Error())
			return
		}
		utils.Success(c, data)
	}
}

// BatchCollectDeviceData 批量采集设备数据
func BatchCollectDeviceData(c *gin.Context) {
	var dataList []models.DeviceData
	if err := c.ShouldBindJSON(&dataList); err != nil {
		utils.FailBadRequest(c, "参数错误："+err.Error())
		return
	}

	successCount := 0
	for i := range dataList {
		if dataList[i].Timestamp.IsZero() {
			dataList[i].Timestamp = time.Now()
		}
		select {
		case database.DataBuffer <- &dataList[i]:
			successCount++
		default:
			if err := database.DB.Create(&dataList[i]).Error; err != nil {
				utils.AppLogger.Errorf("批量写入失败：%v", err)
			} else {
				successCount++
			}
		}
	}

	utils.AppLogger.Infof("批量采集设备数据：成功接收%d条", successCount)
	utils.Success(c, gin.H{
		"received_count": len(dataList),
		"success_count":  successCount,
	})
}
