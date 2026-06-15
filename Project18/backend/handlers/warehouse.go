package handlers

import (
	"delivery-optimizer/database"
	"delivery-optimizer/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func GetWarehouses(c *gin.Context) {
	var warehouses []models.Warehouse
	database.DB.Find(&warehouses)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "success", Data: warehouses})
}

func GetWarehouse(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var warehouse models.Warehouse
	if err := database.DB.First(&warehouse, id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "仓库不存在"})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 0, Message: "success", Data: warehouse})
}

func CreateWarehouse(c *gin.Context) {
	var warehouse models.Warehouse
	if err := c.ShouldBindJSON(&warehouse); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}
	database.DB.Create(&warehouse)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "创建成功", Data: warehouse})
}

func UpdateWarehouse(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var warehouse models.Warehouse
	if err := database.DB.First(&warehouse, id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "仓库不存在"})
		return
	}
	if err := c.ShouldBindJSON(&warehouse); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}
	database.DB.Save(&warehouse)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "更新成功", Data: warehouse})
}

func DeleteWarehouse(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	database.DB.Delete(&models.Warehouse{}, id)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "删除成功"})
}
