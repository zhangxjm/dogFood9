package utils

import (
	"log"
	"os"
)

// Logger 日志级别
type Logger struct {
	infoLogger  *log.Logger
	warnLogger  *log.Logger
	errorLogger *log.Logger
}

// AppLogger 全局日志实例
var AppLogger *Logger

// InitLogger 初始化日志
func InitLogger() {
	AppLogger = &Logger{
		infoLogger:  log.New(os.Stdout, "[信息] ", log.LstdFlags|log.Lshortfile),
		warnLogger:  log.New(os.Stdout, "[警告] ", log.LstdFlags|log.Lshortfile),
		errorLogger: log.New(os.Stderr, "[错误] ", log.LstdFlags|log.Lshortfile),
	}
}

// Info 信息日志
func (l *Logger) Info(v ...interface{}) {
	l.infoLogger.Println(v...)
}

// Infof 格式化信息日志
func (l *Logger) Infof(format string, v ...interface{}) {
	l.infoLogger.Printf(format, v...)
}

// Warn 警告日志
func (l *Logger) Warn(v ...interface{}) {
	l.warnLogger.Println(v...)
}

// Warnf 格式化警告日志
func (l *Logger) Warnf(format string, v ...interface{}) {
	l.warnLogger.Printf(format, v...)
}

// Error 错误日志
func (l *Logger) Error(v ...interface{}) {
	l.errorLogger.Println(v...)
}

// Errorf 格式化错误日志
func (l *Logger) Errorf(format string, v ...interface{}) {
	l.errorLogger.Printf(format, v...)
}
