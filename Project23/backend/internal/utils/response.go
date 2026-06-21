package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Response 统一响应结构
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Success 成功响应
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    0,
		Message: "成功",
		Data:    data,
	})
}

// SuccessWithMessage 成功响应（带自定义消息）
func SuccessWithMessage(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    0,
		Message: message,
		Data:    data,
	})
}

// Fail 失败响应
func Fail(c *gin.Context, httpCode int, code int, message string) {
	c.JSON(httpCode, Response{
		Code:    code,
		Message: message,
	})
}

// FailBadRequest 请求参数错误
func FailBadRequest(c *gin.Context, message string) {
	Fail(c, http.StatusBadRequest, 40001, message)
}

// FailNotFound 资源不存在
func FailNotFound(c *gin.Context, message string) {
	Fail(c, http.StatusNotFound, 40401, message)
}

// FailInternalError 服务器内部错误
func FailInternalError(c *gin.Context, message string) {
	Fail(c, http.StatusInternalServerError, 50001, message)
}
