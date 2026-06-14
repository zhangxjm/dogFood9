package controllers

import (
	"smart-irrigation/models"
	"smart-irrigation/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetAlerts(c *gin.Context) {
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	var resolved *bool
	if r := c.Query("resolved"); r != "" {
		val := r == "true"
		resolved = &val
	}

	alerts, err := models.GetAlerts(resolved, limit)
	if err != nil {
		utils.InternalError(c, "Failed to get alerts")
		return
	}

	utils.Success(c, alerts)
}

func ResolveAlert(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid alert ID")
		return
	}

	if err := models.ResolveAlert(uint(id)); err != nil {
		utils.InternalError(c, "Failed to resolve alert")
		return
	}

	utils.Success(c, nil)
}

func GetAlertStats(c *gin.Context) {
	count, err := models.GetUnresolvedCount()
	if err != nil {
		utils.InternalError(c, "Failed to get alert stats")
		return
	}

	utils.Success(c, map[string]interface{}{
		"unresolved_count": count,
	})
}
