package main

import (
	"encoding/json"
	"html/template"
	"log"
	"os"
	"os/signal"
	"path/filepath"
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
	log.Println("Database initialized successfully")

	if err := database.InitSeedData(); err != nil {
		log.Fatalf("Failed to initialize seed data: %v", err)
	}
	log.Println("Seed data initialized successfully")

	servicePort := 8080
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
		log.Println("Continuing without service discovery...")
	} else {
		serviceName := "api-gateway"
		serviceID := serviceName + "-" + strconv.Itoa(servicePort)
		serviceAddr := consul.GetOutboundIP()
		tags := []string{serviceName, "v1", "gateway"}
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

	r.SetFuncMap(template.FuncMap{
		"add":    func(a, b int) int { return a + b },
		"slice":  func(s string, start, end int) string { runes := []rune(s); if end > len(runes) { end = len(runes) }; return string(runes[start:end]) },
		"substr": func(s string, start, length int) string { runes := []rune(s); if start+length > len(runes) { return string(runes[start:]) }; return string(runes[start : start+length]) },
		"json":   func(v interface{}) string { b, _ := json.Marshal(v); return string(b) },
	})

	templatesDir, _ := filepath.Abs("./web/templates")
	r.LoadHTMLGlob(templatesDir + "/*.html")

	staticDir, _ := filepath.Abs("./web/static")
	r.Static("/static", staticDir)

	r.Use(middleware.CORSMiddleware())
	r.Use(middleware.AuthMiddleware())

	homeHandler := handler.NewHomeHandler()
	authHandler := handler.NewAuthHandler()
	catalogHandler := handler.NewDataCatalogHandler()
	permissionHandler := handler.NewPermissionHandler()
	auditHandler := handler.NewAuditHandler()
	deptHandler := handler.NewDepartmentHandler()
	exchangeHandler := handler.NewDataExchangeHandler()

	r.GET("/health", handler.Health)
	r.GET("/login", authHandler.Login)
	r.POST("/login", authHandler.Login)
	r.GET("/logout", authHandler.Logout)
	r.POST("/api/auth/login", authHandler.Login)

	authorized := r.Group("/")
	{
		authorized.GET("/", homeHandler.Index)

		catalog := authorized.Group("/catalog")
		{
			catalog.GET("", catalogHandler.List)
			catalog.GET("/:id", catalogHandler.Get)
			catalog.POST("", middleware.AdminRequired(), catalogHandler.Create)
			catalog.PUT("/:id", middleware.AdminRequired(), catalogHandler.Update)
			catalog.DELETE("/:id", middleware.AdminRequired(), catalogHandler.Delete)
		}

		apiCatalog := authorized.Group("/api/catalog")
		{
			apiCatalog.GET("", catalogHandler.List)
			apiCatalog.GET("/:id", catalogHandler.Get)
			apiCatalog.POST("", middleware.AdminRequired(), catalogHandler.Create)
			apiCatalog.PUT("/:id", middleware.AdminRequired(), catalogHandler.Update)
			apiCatalog.DELETE("/:id", middleware.AdminRequired(), catalogHandler.Delete)
		}

		permission := authorized.Group("/permission")
		{
			permission.GET("", permissionHandler.MyPermissions)
			permission.GET("/check", permissionHandler.CheckPermission)
			permission.GET("/requests", permissionHandler.ListRequests)
			permission.POST("/requests", permissionHandler.CreateRequest)
		}

		apiPermission := authorized.Group("/api/permission")
		{
			apiPermission.GET("", permissionHandler.MyPermissions)
			apiPermission.GET("/check", permissionHandler.CheckPermission)
			apiPermission.GET("/requests", permissionHandler.ListRequests)
			apiPermission.POST("/requests", permissionHandler.CreateRequest)
		}

		audit := authorized.Group("/audit")
		{
			audit.GET("", middleware.AuditorRequired(), auditHandler.List)
		}

		apiAudit := authorized.Group("/api/audit")
		{
			apiAudit.GET("", middleware.AuditorRequired(), auditHandler.List)
		}

		exchange := authorized.Group("/exchange")
		{
			exchange.GET("", exchangeHandler.List)
			exchange.POST("", exchangeHandler.RequestData)
			exchange.GET("/preview/:id", exchangeHandler.GetDataPreview)
		}

		apiExchange := authorized.Group("/api/exchange")
		{
			apiExchange.GET("", exchangeHandler.List)
			apiExchange.POST("", exchangeHandler.RequestData)
			apiExchange.GET("/preview/:id", exchangeHandler.GetDataPreview)
		}

		apiDept := authorized.Group("/api/department")
		{
			apiDept.GET("", deptHandler.List)
		}
	}

	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan
		log.Println("Shutting down gracefully...")
		close(stopChan)
		os.Exit(0)
	}()

	log.Printf("API Gateway starting on port %d...", servicePort)
	log.Printf("Web interface: http://localhost:%d", servicePort)
	log.Printf("Default admin: admin / admin123")
	if err := r.Run(":" + strconv.Itoa(servicePort)); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
