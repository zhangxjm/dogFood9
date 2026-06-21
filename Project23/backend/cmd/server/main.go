package main

import (
	"backend/internal/config"
	"backend/internal/handlers"
	"backend/internal/routes"
	"backend/internal/utils"
	"backend/pkg/database"
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	utils.InitLogger()
	utils.AppLogger.Info("设备管理后端服务启动中...")

	if err := database.InitDatabase(); err != nil {
		utils.AppLogger.Errorf("数据库初始化失败：%v", err)
		os.Exit(1)
	}

	if err := database.AutoMigrate(); err != nil {
		utils.AppLogger.Errorf("数据库迁移失败：%v", err)
		os.Exit(1)
	}

	if err := database.SeedMockData(); err != nil {
		utils.AppLogger.Errorf("模拟数据初始化失败：%v", err)
		os.Exit(1)
	}

	database.InitDataBuffer()

	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	routes.SetupRoutes(r)

	go handlers.GlobalHub.Run()
	go handlers.StartDataSimulator()

	srv := &http.Server{
		Addr:         config.GlobalConfig.Server.Port,
		Handler:      r,
		ReadTimeout:  config.GlobalConfig.Server.ReadTimeout,
		WriteTimeout: config.GlobalConfig.Server.WriteTimeout,
	}

	go func() {
		utils.AppLogger.Infof("HTTP服务启动成功，监听端口 %s", config.GlobalConfig.Server.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			utils.AppLogger.Errorf("服务启动失败：%v", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	utils.AppLogger.Info("收到关闭信号，正在关闭服务...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		utils.AppLogger.Errorf("服务强制关闭：%v", err)
	}

	utils.AppLogger.Info("服务已正常退出")
}
