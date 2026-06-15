package handlers

import (
	"delivery-optimizer/database"
	"delivery-optimizer/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetDrivers(c *gin.Context) {
	var drivers []models.Driver
	database.DB.Find(&drivers)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "success", Data: drivers})
}

func GetDriver(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var driver models.Driver
	if err := database.DB.First(&driver, id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "司机不存在"})
		return
	}
	c.JSON(http.StatusOK, Response{Code: 0, Message: "success", Data: driver})
}

func CreateDriver(c *gin.Context) {
	var driver models.Driver
	if err := c.ShouldBindJSON(&driver); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}
	if driver.Status == "" {
		driver.Status = "空闲"
	}
	database.DB.Create(&driver)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "创建成功", Data: driver})
}

func UpdateDriver(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var driver models.Driver
	if err := database.DB.First(&driver, id).Error; err != nil {
		c.JSON(http.StatusNotFound, Response{Code: 404, Message: "司机不存在"})
		return
	}
	if err := c.ShouldBindJSON(&driver); err != nil {
		c.JSON(http.StatusBadRequest, Response{Code: 400, Message: err.Error()})
		return
	}
	database.DB.Save(&driver)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "更新成功", Data: driver})
}

func DeleteDriver(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	database.DB.Delete(&models.Driver{}, id)
	c.JSON(http.StatusOK, Response{Code: 0, Message: "删除成功"})
}
