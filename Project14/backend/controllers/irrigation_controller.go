package controllers

import (
	"smart-irrigation/models"
	"smart-irrigation/services"
	"smart-irrigation/utils"
	"strconv"

	"github.com/gin-gonic/gin"
)

func StartIrrigation(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid valve ID")
		return
	}

	var body struct {
		Duration int    `json:"duration"`
		Mode     string `json:"mode"`
		Reason   string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.BadRequest(c, "Invalid request body")
		return
	}

	mode := models.IrrigationModeManual
	if body.Mode != "" {
		mode = models.IrrigationMode(body.Mode)
	}

	record, err := services.StartIrrigation(uint(id), mode, body.Duration, body.Reason)
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Success(c, record)
}

func StopIrrigation(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid valve ID")
		return
	}

	record, err := services.StopIrrigation(uint(id))
	if err != nil {
		utils.InternalError(c, err.Error())
		return
	}

	utils.Success(c, record)
}

func GetIrrigationRecords(c *gin.Context) {
	limit := 50
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	records, err := models.GetIrrigationRecords(limit)
	if err != nil {
		utils.InternalError(c, "Failed to get irrigation records")
		return
	}

	utils.Success(c, records)
}

func GetValveStatus(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid valve ID")
		return
	}

	record, err := models.GetRunningIrrigation(uint(id))
	if err != nil {
		utils.Success(c, map[string]interface{}{
			"is_running": false,
			"record":     nil,
		})
		return
	}

	utils.Success(c, map[string]interface{}{
		"is_running": true,
		"record":     record,
	})
}

func GetSchedules(c *gin.Context) {
	schedules, err := models.GetAllSchedules()
	if err != nil {
		utils.InternalError(c, "Failed to get schedules")
		return
	}

	utils.Success(c, schedules)
}

func CreateSchedule(c *gin.Context) {
	var schedule models.IrrigationSchedule
	if err := c.ShouldBindJSON(&schedule); err != nil {
		utils.BadRequest(c, "Invalid request body")
		return
	}

	if err := models.CreateSchedule(&schedule); err != nil {
		utils.InternalError(c, "Failed to create schedule")
		return
	}

	utils.Success(c, schedule)
}

func UpdateSchedule(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid schedule ID")
		return
	}

	var schedule models.IrrigationSchedule
	if err := c.ShouldBindJSON(&schedule); err != nil {
		utils.BadRequest(c, "Invalid request body")
		return
	}

	schedule.ID = uint(id)
	if err := models.UpdateSchedule(&schedule); err != nil {
		utils.InternalError(c, "Failed to update schedule")
		return
	}

	utils.Success(c, schedule)
}

func DeleteSchedule(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.BadRequest(c, "Invalid schedule ID")
		return
	}

	if err := models.DeleteSchedule(uint(id)); err != nil {
		utils.InternalError(c, "Failed to delete schedule")
		return
	}

	utils.Success(c, nil)
}
