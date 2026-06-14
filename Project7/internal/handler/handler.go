package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"gov-data-share/internal/middleware"
	"gov-data-share/internal/model"
	"gov-data-share/internal/service"
	"gov-data-share/pkg/common"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		authService: service.NewAuthService(),
	}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	isHTMLRequest := false
	if c.Request.Method == "GET" {
		isHTMLRequest = true
	}
	contentType := c.Request.Header.Get("Content-Type")
	if strings.Contains(contentType, "application/x-www-form-urlencoded") {
		isHTMLRequest = true
	}
	accept := c.Request.Header.Get("Accept")
	if strings.Contains(accept, "text/html") {
		isHTMLRequest = true
	}

	if c.Request.Method == "GET" {
		c.HTML(http.StatusOK, "login.html", gin.H{"error": ""})
		return
	}

	if strings.Contains(contentType, "application/x-www-form-urlencoded") {
		req.Username = c.PostForm("username")
		req.Password = c.PostForm("password")
	} else if strings.Contains(contentType, "application/json") {
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, common.Error(400, "参数错误"))
			return
		}
	} else {
		req.Username = c.PostForm("username")
		req.Password = c.PostForm("password")
		if req.Username == "" {
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, common.Error(400, "参数错误"))
				return
			}
		}
	}

	if req.Username == "" {
		if isHTMLRequest {
			c.HTML(http.StatusOK, "login.html", gin.H{"error": ""})
		} else {
			c.JSON(http.StatusBadRequest, common.Error(400, "用户名不能为空"))
		}
		return
	}

	user, token, err := h.authService.Login(req.Username, req.Password)
	if err != nil {
		if isHTMLRequest {
			c.HTML(http.StatusOK, "login.html", gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusUnauthorized, common.Error(401, err.Error()))
		return
	}

	c.SetCookie("auth_token", token, 86400, "/", "", false, false)
	c.SetCookie("user_id", strconv.Itoa(int(user.ID)), 86400, "/", "", false, false)
	c.SetCookie("user_role", user.Role, 86400, "/", "", false, false)

	if isHTMLRequest {
		c.Redirect(http.StatusFound, "/")
		return
	}

	c.JSON(http.StatusOK, common.Success(gin.H{
		"token": token,
		"user":  user,
	}))
}

func (h *AuthHandler) Logout(c *gin.Context) {
	c.SetCookie("auth_token", "", -1, "/", "", false, true)
	c.SetCookie("user_id", "", -1, "/", "", false, false)
	c.SetCookie("user_name", "", -1, "/", "", false, false)
	c.SetCookie("user_role", "", -1, "/", "", false, false)
	c.Redirect(http.StatusFound, "/login")
}

type DataCatalogHandler struct {
	catalogService *service.DataCatalogService
}

func NewDataCatalogHandler() *DataCatalogHandler {
	return &DataCatalogHandler{
		catalogService: service.NewDataCatalogService(),
	}
}

func (h *DataCatalogHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	keyword := c.Query("keyword")
	securityLevel := c.Query("security_level")
	deptID, _ := strconv.Atoi(c.Query("department_id"))

	catalogs, total, err := h.catalogService.List(page, pageSize, keyword, securityLevel, uint(deptID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.Error(500, "查询失败"))
		return
	}

	for i := range catalogs {
		catalogs[i].SecurityLevel = common.GetSecurityLevelText(catalogs[i].SecurityLevel)
	}

	if strings.Contains(c.Request.Header.Get("Accept"), "text/html") {
		user := middleware.GetCurrentUser(c)
		c.HTML(http.StatusOK, "catalog.html", gin.H{
			"catalogs": catalogs,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
			"user":     user,
			"keyword":  keyword,
		})
		return
	}

	c.JSON(http.StatusOK, common.SuccessWithTotal(catalogs, total))
}

func (h *DataCatalogHandler) Get(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	catalog, err := h.catalogService.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, common.Error(404, "数据目录不存在"))
		return
	}

	c.JSON(http.StatusOK, common.Success(catalog))
}

func (h *DataCatalogHandler) Create(c *gin.Context) {
	var catalog model.DataCatalog
	if err := c.ShouldBindJSON(&catalog); err != nil {
		c.JSON(http.StatusBadRequest, common.Error(400, "参数错误"))
		return
	}

	if err := h.catalogService.Create(&catalog); err != nil {
		c.JSON(http.StatusInternalServerError, common.Error(500, "创建失败"))
		return
	}

	c.JSON(http.StatusOK, common.Success(catalog))
}

func (h *DataCatalogHandler) Update(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var catalog model.DataCatalog
	if err := c.ShouldBindJSON(&catalog); err != nil {
		c.JSON(http.StatusBadRequest, common.Error(400, "参数错误"))
		return
	}
	catalog.ID = uint(id)

	if err := h.catalogService.Update(&catalog); err != nil {
		c.JSON(http.StatusInternalServerError, common.Error(500, "更新失败"))
		return
	}

	c.JSON(http.StatusOK, common.Success(catalog))
}

func (h *DataCatalogHandler) Delete(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	if err := h.catalogService.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, common.Error(500, "删除失败"))
		return
	}

	c.JSON(http.StatusOK, common.Success(nil))
}

type PermissionHandler struct {
	permService *service.PermissionService
}

func NewPermissionHandler() *PermissionHandler {
	return &PermissionHandler{
		permService: service.NewPermissionService(),
	}
}

func (h *PermissionHandler) MyPermissions(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, common.Error(401, "请先登录"))
		return
	}

	permissions, err := h.permService.GetUserPermissions(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.Error(500, "查询失败"))
		return
	}

	if strings.Contains(c.Request.Header.Get("Accept"), "text/html") {
		c.HTML(http.StatusOK, "permission.html", gin.H{
			"permissions": permissions,
			"user":        user,
		})
		return
	}

	c.JSON(http.StatusOK, common.Success(permissions))
}

func (h *PermissionHandler) CheckPermission(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	catalogID, _ := strconv.Atoi(c.Query("catalog_id"))
	accessType := c.DefaultQuery("access_type", "read")

	hasPerm := h.permService.CheckPermission(user.ID, uint(catalogID), accessType)
	c.JSON(http.StatusOK, common.Success(gin.H{"has_permission": hasPerm}))
}

func (h *PermissionHandler) CreateRequest(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, common.Error(401, "请先登录"))
		return
	}

	var req struct {
		DataCatalogID uint   `json:"data_catalog_id" binding:"required"`
		AccessType    string `json:"access_type" binding:"required"`
		Purpose       string `json:"purpose" binding:"required"`
		UsageScope    string `json:"usage_scope"`
		ValidDays     int    `json:"valid_days" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		if c.Request.Method == "POST" && c.Request.Header.Get("Content-Type") == "application/x-www-form-urlencoded" {
			cid, _ := strconv.ParseUint(c.PostForm("data_catalog_id"), 10, 32)
			req.DataCatalogID = uint(cid)
			req.AccessType = c.PostForm("access_type")
			req.Purpose = c.PostForm("purpose")
			req.UsageScope = c.PostForm("usage_scope")
			req.ValidDays, _ = strconv.Atoi(c.PostForm("valid_days"))
		} else {
			c.JSON(http.StatusBadRequest, common.Error(400, "参数错误"))
			return
		}
	}

	err := h.permService.CreateRequest(user.ID, uint(req.DataCatalogID), req.AccessType, req.Purpose, req.UsageScope, req.ValidDays)
	if err != nil {
		if strings.Contains(c.Request.Header.Get("Content-Type"), "application/x-www-form-urlencoded") {
			c.Redirect(http.StatusFound, "/permission/requests?error="+err.Error())
			return
		}
		c.JSON(http.StatusInternalServerError, common.Error(500, err.Error()))
		return
	}

	if strings.Contains(c.Request.Header.Get("Content-Type"), "application/x-www-form-urlencoded") {
		c.Redirect(http.StatusFound, "/permission/requests?success=申请提交成功，已自动审批")
		return
	}

	c.JSON(http.StatusOK, common.Success(nil))
}

func (h *PermissionHandler) ListRequests(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")

	applicantID := uint(0)
	if user.Role != "admin" && user.Role != "auditor" {
		applicantID = user.ID
	}

	requests, total, err := h.permService.ListRequests(page, pageSize, applicantID, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.Error(500, "查询失败"))
		return
	}

	statusMap := map[string]string{
		"pending":  "待审批",
		"approved": "已通过",
		"rejected": "已拒绝",
	}
	for i := range requests {
		if text, ok := statusMap[requests[i].Status]; ok {
			requests[i].Status = text
		}
	}

	if strings.Contains(c.Request.Header.Get("Accept"), "text/html") {
		c.HTML(http.StatusOK, "request.html", gin.H{
			"requests": requests,
			"total":    total,
			"page":     page,
			"pageSize": pageSize,
			"user":     user,
			"success":  c.Query("success"),
			"error":    c.Query("error"),
		})
		return
	}

	c.JSON(http.StatusOK, common.SuccessWithTotal(requests, total))
}

type AuditHandler struct {
	auditService *service.AuditService
}

func NewAuditHandler() *AuditHandler {
	return &AuditHandler{
		auditService: service.NewAuditService(),
	}
}

func (h *AuditHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	userID, _ := strconv.Atoi(c.Query("user_id"))
	operation := c.Query("operation")
	resourceType := c.Query("resource_type")
	startTimeStr := c.Query("start_time")
	endTimeStr := c.Query("end_time")

	var startTime, endTime time.Time
	if startTimeStr != "" {
		startTime, _ = time.Parse("2006-01-02", startTimeStr)
	}
	if endTimeStr != "" {
		endTime, _ = time.Parse("2006-01-02", endTimeStr)
	}

	logs, total, err := h.auditService.List(page, pageSize, uint(userID), operation, resourceType, startTime, endTime)
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.Error(500, "查询失败"))
		return
	}

	user := middleware.GetCurrentUser(c)
	if strings.Contains(c.Request.Header.Get("Accept"), "text/html") {
		c.HTML(http.StatusOK, "audit.html", gin.H{
			"logs":       logs,
			"total":      total,
			"page":       page,
			"pageSize":   pageSize,
			"user":       user,
			"start_time": startTimeStr,
			"end_time":   endTimeStr,
		})
		return
	}

	c.JSON(http.StatusOK, common.SuccessWithTotal(logs, total))
}

type DepartmentHandler struct {
	deptService *service.DepartmentService
}

func NewDepartmentHandler() *DepartmentHandler {
	return &DepartmentHandler{
		deptService: service.NewDepartmentService(),
	}
}

func (h *DepartmentHandler) List(c *gin.Context) {
	departments, err := h.deptService.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.Error(500, "查询失败"))
		return
	}
	c.JSON(http.StatusOK, common.Success(departments))
}

type DataExchangeHandler struct {
	exchangeService *service.DataExchangeService
}

func NewDataExchangeHandler() *DataExchangeHandler {
	return &DataExchangeHandler{
		exchangeService: service.NewDataExchangeService(),
	}
}

func (h *DataExchangeHandler) RequestData(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, common.Error(401, "请先登录"))
		return
	}

	var req struct {
		DataCatalogID uint   `json:"data_catalog_id" binding:"required"`
		ExchangeType  string `json:"exchange_type" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, common.Error(400, "参数错误"))
		return
	}

	exchange, err := h.exchangeService.RequestData(user.ID, req.DataCatalogID, req.ExchangeType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.Error(500, err.Error()))
		return
	}

	c.JSON(http.StatusOK, common.Success(exchange))
}

func (h *DataExchangeHandler) List(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	status := c.Query("status")

	requesterID := uint(0)
	if user.Role != "admin" && user.Role != "auditor" {
		requesterID = user.ID
	}

	exchanges, total, err := h.exchangeService.List(page, pageSize, requesterID, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.Error(500, "查询失败"))
		return
	}

	statusMap := map[string]string{
		"processing": "处理中",
		"completed":  "已完成",
		"failed":     "失败",
	}
	for i := range exchanges {
		if text, ok := statusMap[exchanges[i].Status]; ok {
			exchanges[i].Status = text
		}
	}

	if strings.Contains(c.Request.Header.Get("Accept"), "text/html") {
		c.HTML(http.StatusOK, "exchange.html", gin.H{
			"exchanges": exchanges,
			"total":     total,
			"page":      page,
			"pageSize":  pageSize,
			"user":      user,
		})
		return
	}

	c.JSON(http.StatusOK, common.SuccessWithTotal(exchanges, total))
}

func (h *DataExchangeHandler) GetDataPreview(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	catalogID, _ := strconv.Atoi(c.Param("id"))

	data, err := h.exchangeService.GetDataPreview(uint(catalogID), user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, common.Error(500, err.Error()))
		return
	}

	if strings.Contains(c.Request.Header.Get("Accept"), "text/html") {
		c.HTML(http.StatusOK, "preview.html", gin.H{
			"data": data,
			"user": user,
		})
		return
	}

	c.JSON(http.StatusOK, common.Success(data))
}

type HomeHandler struct {
	catalogService  *service.DataCatalogService
	exchangeService *service.DataExchangeService
	auditService    *service.AuditService
	deptService     *service.DepartmentService
}

func NewHomeHandler() *HomeHandler {
	return &HomeHandler{
		catalogService:  service.NewDataCatalogService(),
		exchangeService: service.NewDataExchangeService(),
		auditService:    service.NewAuditService(),
		deptService:     service.NewDepartmentService(),
	}
}

func (h *HomeHandler) Index(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.Redirect(http.StatusFound, "/login")
		return
	}

	_, catalogTotal, _ := h.catalogService.List(1, 1, "", "", 0)
	_, exchangeTotal, _ := h.exchangeService.List(1, 1, 0, "")
	_, auditTotal, _ := h.auditService.List(1, 1, 0, "", "", time.Time{}, time.Time{})
	depts, _ := h.deptService.List()

	c.HTML(http.StatusOK, "index.html", gin.H{
		"user":          user,
		"catalogTotal":  catalogTotal,
		"exchangeTotal": exchangeTotal,
		"auditTotal":    auditTotal,
		"deptTotal":     len(depts),
	})
}

func Health(c *gin.Context) {
	c.JSON(http.StatusOK, common.Success(gin.H{
		"status":    "healthy",
		"timestamp": time.Now().Format("2006-01-02 15:04:05"),
	}))
}
