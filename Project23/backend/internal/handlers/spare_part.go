package handlers

import (
	"backend/internal/models"
	"backend/internal/utils"
	"backend/pkg/database"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GetSparePartList 获取备件列表
func GetSparePartList(c *gin.Context) {
	var parts []models.SparePart
	query := database.DB

	if name := c.Query("name"); name != "" {
		query = query.Where("name LIKE ?", "%"+name+"%")
	}

	if err := query.Find(&parts).Error; err != nil {
		utils.FailInternalError(c, "获取备件列表失败："+err.Error())
		return
	}

	utils.Success(c, parts)
}

// GetSparePart 获取单个备件详情
func GetSparePart(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的备件ID")
		return
	}

	var part models.SparePart
	if err := database.DB.First(&part, uint(id)).Error; err != nil {
		utils.FailNotFound(c, "备件不存在")
		return
	}

	utils.Success(c, part)
}

// CreateSparePart 创建备件
func CreateSparePart(c *gin.Context) {
	var part models.SparePart
	if err := c.ShouldBindJSON(&part); err != nil {
		utils.FailBadRequest(c, "参数错误："+err.Error())
		return
	}

	if err := database.DB.Create(&part).Error; err != nil {
		utils.FailInternalError(c, "创建备件失败："+err.Error())
		return
	}

	utils.AppLogger.Infof("创建备件成功：%s", part.Name)
	utils.Success(c, part)
}

// UpdateSparePart 更新备件
func UpdateSparePart(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的备件ID")
		return
	}

	var part models.SparePart
	if err := database.DB.First(&part, uint(id)).Error; err != nil {
		utils.FailNotFound(c, "备件不存在")
		return
	}

	var updateData models.SparePart
	if err := c.ShouldBindJSON(&updateData); err != nil {
		utils.FailBadRequest(c, "参数错误："+err.Error())
		return
	}

	if err := database.DB.Model(&part).Updates(updateData).Error; err != nil {
		utils.FailInternalError(c, "更新备件失败："+err.Error())
		return
	}

	database.DB.First(&part, uint(id))
	utils.Success(c, part)
}

// DeleteSparePart 删除备件
func DeleteSparePart(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的备件ID")
		return
	}

	if err := database.DB.Delete(&models.SparePart{}, uint(id)).Error; err != nil {
		utils.FailInternalError(c, "删除备件失败："+err.Error())
		return
	}

	utils.Success(c, nil)
}

// GetSparePartStockList 获取备件库存列表
func GetSparePartStockList(c *gin.Context) {
	var stocks []models.SparePartStock
	query := database.DB.Preload("Part")

	if partIDStr := c.Query("part_id"); partIDStr != "" {
		partID, err := strconv.ParseUint(partIDStr, 10, 32)
		if err == nil {
			query = query.Where("part_id = ?", uint(partID))
		}
	}

	if lowStock := c.Query("low_stock"); lowStock == "true" {
		query = query.Where("quantity <= min_stock")
	}

	if err := query.Find(&stocks).Error; err != nil {
		utils.FailInternalError(c, "获取备件库存列表失败："+err.Error())
		return
	}

	utils.Success(c, stocks)
}

// GetSparePartStock 获取单个备件库存
func GetSparePartStock(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的库存ID")
		return
	}

	var stock models.SparePartStock
	if err := database.DB.Preload("Part").First(&stock, uint(id)).Error; err != nil {
		utils.FailNotFound(c, "备件库存不存在")
		return
	}

	utils.Success(c, stock)
}

// CreateSparePartStock 创建备件库存
func CreateSparePartStock(c *gin.Context) {
	var stock models.SparePartStock
	if err := c.ShouldBindJSON(&stock); err != nil {
		utils.FailBadRequest(c, "参数错误："+err.Error())
		return
	}

	if stock.Warehouse == "" {
		stock.Warehouse = "主仓库"
	}
	stock.LastUpdate = time.Now()

	if err := database.DB.Create(&stock).Error; err != nil {
		utils.FailInternalError(c, "创建备件库存失败："+err.Error())
		return
	}

	utils.AppLogger.Infof("创建备件库存成功：备件ID=%d 仓库=%s 数量=%d",
		stock.PartID, stock.Warehouse, stock.Quantity)
	utils.Success(c, stock)
}

// UpdateSparePartStock 更新备件库存
func UpdateSparePartStock(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的库存ID")
		return
	}

	var stock models.SparePartStock
	if err := database.DB.First(&stock, uint(id)).Error; err != nil {
		utils.FailNotFound(c, "备件库存不存在")
		return
	}

	var updateData models.SparePartStock
	if err := c.ShouldBindJSON(&updateData); err != nil {
		utils.FailBadRequest(c, "参数错误："+err.Error())
		return
	}

	updateData.LastUpdate = time.Now()

	if err := database.DB.Model(&stock).Updates(updateData).Error; err != nil {
		utils.FailInternalError(c, "更新备件库存失败："+err.Error())
		return
	}

	database.DB.Preload("Part").First(&stock, uint(id))
	utils.Success(c, stock)
}

// DeleteSparePartStock 删除备件库存
func DeleteSparePartStock(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.FailBadRequest(c, "无效的库存ID")
		return
	}

	if err := database.DB.Delete(&models.SparePartStock{}, uint(id)).Error; err != nil {
		utils.FailInternalError(c, "删除备件库存失败："+err.Error())
		return
	}

	utils.Success(c, nil)
}
