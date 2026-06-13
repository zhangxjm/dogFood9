package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"gov-data-share/internal/model"
	"gov-data-share/pkg/common"
	"gov-data-share/pkg/database"
)

type UserContext struct {
	ID           uint
	Username     string
	RealName     string
	DepartmentID uint
	Role         string
}

const UserContextKey = "user_context"

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			authHeader = c.Request.Header.Get("Authorization")
		}

		if authHeader == "" {
			cookie, err := c.Cookie("auth_token")
			if err == nil {
				authHeader = "Bearer " + cookie
			}
		}

		if authHeader == "" {
			if c.Request.URL.Path == "/login" || c.Request.URL.Path == "/api/auth/login" ||
				strings.HasPrefix(c.Request.URL.Path, "/static/") ||
				strings.HasPrefix(c.Request.URL.Path, "/health") {
				c.Next()
				return
			}
			c.Redirect(http.StatusFound, "/login")
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, common.Error(401, "无效的认证令牌"))
			c.Abort()
			return
		}

		token := parts[1]
		var user model.User
		if err := database.DB.Where("id = ?", token).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, common.Error(401, "认证失败，请重新登录"))
			c.Abort()
			return
		}

		if user.Status != 1 {
			c.JSON(http.StatusForbidden, common.Error(403, "账号已被禁用"))
			c.Abort()
			return
		}

		userCtx := UserContext{
			ID:           user.ID,
			Username:     user.Username,
			RealName:     user.RealName,
			DepartmentID: user.DepartmentID,
			Role:         user.Role,
		}
		c.Set(UserContextKey, userCtx)

		go recordAuditLog(c, userCtx)

		c.Next()
	}
}

func recordAuditLog(c *gin.Context, user UserContext) {
	if c.Request.Method == "GET" && !strings.Contains(c.Request.URL.Path, "export") {
		return
	}

	auditLog := model.AuditLog{
		UserID:        user.ID,
		Username:      user.Username,
		RealName:      user.RealName,
		DepartmentID:  user.DepartmentID,
		Operation:     c.Request.Method,
		ResourceType:  getResourceType(c.Request.URL.Path),
		IPAddress:     common.GetClientIP(c.Request),
		UserAgent:     c.Request.UserAgent(),
		OperationTime: time.Now(),
		Success:       true,
	}

	database.DB.Create(&auditLog)
}

func getResourceType(path string) string {
	switch {
	case strings.Contains(path, "catalog"):
		return "数据目录"
	case strings.Contains(path, "permission"):
		return "权限管理"
	case strings.Contains(path, "request"):
		return "权限申请"
	case strings.Contains(path, "audit"):
		return "审计日志"
	case strings.Contains(path, "exchange"):
		return "数据交换"
	case strings.Contains(path, "user"):
		return "用户管理"
	case strings.Contains(path, "department"):
		return "部门管理"
	default:
		return "其他操作"
	}
}

func GetCurrentUser(c *gin.Context) *UserContext {
	value, exists := c.Get(UserContextKey)
	if !exists {
		return nil
	}
	user, ok := value.(UserContext)
	if !ok {
		return nil
	}
	return &user
}

func AdminRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		user := GetCurrentUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, common.Error(401, "请先登录"))
			c.Abort()
			return
		}
		if user.Role != "admin" {
			c.JSON(http.StatusForbidden, common.Error(403, "需要管理员权限"))
			c.Abort()
			return
		}
		c.Next()
	}
}

func AuditorRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		user := GetCurrentUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, common.Error(401, "请先登录"))
			c.Abort()
			return
		}
		if user.Role != "admin" && user.Role != "auditor" {
			c.JSON(http.StatusForbidden, common.Error(403, "需要审计员权限"))
			c.Abort()
			return
		}
		c.Next()
	}
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
