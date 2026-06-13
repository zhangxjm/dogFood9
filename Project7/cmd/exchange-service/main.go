package main

import (
	"log"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"github.com/gin-gonic/gin"

	"gov-data-share/internal/handler"
	"gov-data-share/internal/middleware"
	"gov-data-share/pkg/consul"
	"gov-data-share/pkg/database"
)

var stopChan = make(chan struct{})

func main() {
	dbPath := "./data/gov_data_share.db"
	if err := database.InitDB(dbPath); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	servicePort := 8084
	if port := os.Getenv("SERVICE_PORT"); port != "" {
		servicePort, _ = strconv.Atoi(port)
	}

	consulAddr := "127.0.0.1:8500"
	if addr := os.Getenv("CONSUL_ADDR"); addr != "" {
		consulAddr = addr
	}

	consulClient, err := consul.NewConsulClient(consulAddr)
	if err != nil {
		log.Printf("Warning: Failed to connect to Consul: %v", err)
	} else {
		serviceName := "exchange-service"
		serviceID := serviceName + "-" + strconv.Itoa(servicePort)
		serviceAddr := consul.GetOutboundIP()
		tags := []string{serviceName, "v1", "exchange"}
		healthCheckPath := "/health"

		if err := consulClient.RegisterService(serviceName, serviceID, serviceAddr, servicePort, tags, healthCheckPath); err != nil {
			log.Printf("Warning: Failed to register service: %v", err)
		} else {
			go consulClient.KeepAlive(serviceName, serviceID, serviceAddr, servicePort, stopChan)
		}

		defer func() {
			close(stopChan)
			consulClient.DeregisterService(serviceID)
		}()
	}

	r := gin.Default()
	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.AuthMiddleware())

	exchangeHandler := handler.NewDataExchangeHandler()

	r.GET("/health", handler.Health)

	api := r.Group("/api/v1/exchange")
	{
		api.GET("", exchangeHandler.List)
		api.POST("", exchangeHandler.RequestData)
		api.GET("/preview/:id", exchangeHandler.GetDataPreview)
	}

	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan
		log.Println("Shutting down gracefully...")
		close(stopChan)
		os.Exit(0)
	}()

	log.Printf("Exchange Service starting on port %d...", servicePort)
	if err := r.Run(":" + strconv.Itoa(servicePort)); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
