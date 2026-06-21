package middleware

import (
	"backend/internal/utils"
	"time"

	"github.com/gin-gonic/gin"
)

// LoggerMiddleware 请求日志中间件
func LoggerMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()
		path := c.Request.URL.Path
		method := c.Request.Method

		c.Next()

		latency := time.Since(startTime)
		statusCode := c.Writer.Status()
		clientIP := c.ClientIP()

		if statusCode >= 500 {
			utils.AppLogger.Errorf("[%s] %s %s - %d (%v) IP:%s",
				method, path, c.Errors.String(), statusCode, latency, clientIP)
		} else if statusCode >= 400 {
			utils.AppLogger.Warnf("[%s] %s - %d (%v) IP:%s",
				method, path, statusCode, latency, clientIP)
		} else {
			utils.AppLogger.Infof("[%s] %s - %d (%v) IP:%s",
				method, path, statusCode, latency, clientIP)
		}
	}
}
