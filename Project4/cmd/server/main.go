package main

import (
	"context"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	pb "fire-fighting-twin/api/gen/firefighting"
	"fire-fighting-twin/internal/config"
	"fire-fighting-twin/internal/handler"
	"fire-fighting-twin/internal/repository"
	"fire-fighting-twin/internal/service"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/redis/go-redis/v9"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/reflection"
)

func initTracer(jaegerEndpoint string) (func(context.Context) error, error) {
	exporter, err := otlptrace.New(context.Background(), otlptracegrpc.NewClient(
		otlptracegrpc.WithEndpoint(jaegerEndpoint),
		otlptracegrpc.WithInsecure(),
	))
	if err != nil {
		log.Printf("Warning: Failed to create OTLP exporter: %v, tracing disabled", err)
		return func(ctx context.Context) error { return nil }, nil
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(nil),
	)
	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	var tpShutdown = tp
	return func(ctx context.Context) error {
		ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		return tpShutdown.Shutdown(ctx)
	}, nil
}

func main() {
	cfg := config.Load()

	shutdown, err := initTracer(cfg.JaegerEndpoint)
	if err != nil {
		log.Printf("Warning: Tracer init failed: %v", err)
	}
	defer shutdown(context.Background())

	tracer := otel.Tracer("fire-fighting-twin")
	_, span := tracer.Start(context.Background(), "server.startup")
	span.End()

	dbDir := filepath.Dir(cfg.SQLitePath)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		log.Fatalf("Failed to create data directory: %v", err)
	}

	sqliteRepo, err := repository.NewSQLiteRepo(cfg.SQLitePath)
	if err != nil {
		log.Fatalf("Failed to initialize SQLite: %v", err)
	}

	var redisRepo *repository.RedisRepo
	redisRepo, err = repository.NewRedisRepo(cfg.RedisAddr, cfg.RedisPassword, cfg.RedisDB)
	if err != nil {
		log.Printf("Warning: Redis connection failed: %v, running without cache", err)
		redisRepo, _ = repository.NewRedisRepoWithClient(redis.NewClient(&redis.Options{
			Addr: cfg.RedisAddr,
		}))
	}

	svc := service.NewService(sqliteRepo, redisRepo)

	log.Println("Seeding initial data...")
	if err := sqliteRepo.SeedData(); err != nil {
		log.Printf("Warning: Seed data error: %v", err)
	}

	svc.StartPersonnelSimulation()

	grpcSrv := grpc.NewServer(
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
	)

	pb.RegisterBuildingServiceServer(grpcSrv, handler.NewBuildingHandler(svc))
	pb.RegisterWaterSourceServiceServer(grpcSrv, handler.NewWaterSourceHandler(svc))
	pb.RegisterFirePassageServiceServer(grpcSrv, handler.NewFirePassageHandler(svc))
	pb.RegisterPersonnelServiceServer(grpcSrv, handler.NewPersonnelHandler(svc))
	pb.RegisterRescuePlanServiceServer(grpcSrv, handler.NewRescuePlanHandler(svc))
	pb.RegisterForceScheduleServiceServer(grpcSrv, handler.NewForceScheduleHandler(svc))
	pb.RegisterFireSituationServiceServer(grpcSrv, handler.NewFireSituationHandler(svc))
	pb.RegisterCommandServiceServer(grpcSrv, handler.NewCommandHandler(svc))
	pb.RegisterResourceServiceServer(grpcSrv, handler.NewResourceHandler(svc))
	pb.RegisterMonitorServiceServer(grpcSrv, handler.NewMonitorHandler(svc))

	reflection.Register(grpcSrv)

	grpcLis, err := net.Listen("tcp", fmt.Sprintf(":%s", cfg.GRPCPort))
	if err != nil {
		log.Fatalf("Failed to listen on gRPC port %s: %v", cfg.GRPCPort, err)
	}

	go func() {
		log.Printf("gRPC server listening on :%s", cfg.GRPCPort)
		if err := grpcSrv.Serve(grpcLis); err != nil {
			log.Fatalf("gRPC server failed: %v", err)
		}
	}()

	ctx := context.Background()
	gwMux := runtime.NewServeMux(
		runtime.WithMarshalerOption(runtime.MIMEWildcard, &runtime.JSONPb{}),
	)

	opts := []grpc.DialOption{
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
	}

	grpcEndpoint := fmt.Sprintf("localhost:%s", cfg.GRPCPort)

	if err := pb.RegisterBuildingServiceHandlerFromEndpoint(ctx, gwMux, grpcEndpoint, opts); err != nil {
		log.Fatalf("Failed to register Building gateway: %v", err)
	}
	if err := pb.RegisterWaterSourceServiceHandlerFromEndpoint(ctx, gwMux, grpcEndpoint, opts); err != nil {
		log.Fatalf("Failed to register WaterSource gateway: %v", err)
	}
	if err := pb.RegisterFirePassageServiceHandlerFromEndpoint(ctx, gwMux, grpcEndpoint, opts); err != nil {
		log.Fatalf("Failed to register FirePassage gateway: %v", err)
	}
	if err := pb.RegisterPersonnelServiceHandlerFromEndpoint(ctx, gwMux, grpcEndpoint, opts); err != nil {
		log.Fatalf("Failed to register Personnel gateway: %v", err)
	}
	if err := pb.RegisterRescuePlanServiceHandlerFromEndpoint(ctx, gwMux, grpcEndpoint, opts); err != nil {
		log.Fatalf("Failed to register RescuePlan gateway: %v", err)
	}
	if err := pb.RegisterForceScheduleServiceHandlerFromEndpoint(ctx, gwMux, grpcEndpoint, opts); err != nil {
		log.Fatalf("Failed to register ForceSchedule gateway: %v", err)
	}
	if err := pb.RegisterFireSituationServiceHandlerFromEndpoint(ctx, gwMux, grpcEndpoint, opts); err != nil {
		log.Fatalf("Failed to register FireSituation gateway: %v", err)
	}
	if err := pb.RegisterCommandServiceHandlerFromEndpoint(ctx, gwMux, grpcEndpoint, opts); err != nil {
		log.Fatalf("Failed to register Command gateway: %v", err)
	}
	if err := pb.RegisterResourceServiceHandlerFromEndpoint(ctx, gwMux, grpcEndpoint, opts); err != nil {
		log.Fatalf("Failed to register Resource gateway: %v", err)
	}
	if err := pb.RegisterMonitorServiceHandlerFromEndpoint(ctx, gwMux, grpcEndpoint, opts); err != nil {
		log.Fatalf("Failed to register Monitor gateway: %v", err)
	}

	webDir := "./web"
	fileServer := http.FileServer(http.Dir(webDir))

	mux := http.NewServeMux()
	mux.Handle("/api/", otelhttp.NewHandler(gwMux, "api-gateway"))
	mux.Handle("/", otelhttp.NewHandler(fileServer, "static-files"))

	httpAddr := fmt.Sprintf(":%s", cfg.HTTPPort)
	log.Printf("HTTP gateway listening on %s", httpAddr)
	log.Printf("Web UI available at http://localhost%s", httpAddr)
	log.Printf("Jaeger UI available at http://localhost:16686")

	httpServer := &http.Server{
		Addr:    httpAddr,
		Handler: mux,
	}

	go func() {
		if err := httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server failed: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down servers...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	httpServer.Shutdown(shutdownCtx)
	grpcSrv.GracefulStop()

	if redisRepo != nil {
		redisRepo.Close()
	}

	log.Println("Server shutdown complete")
}

var _ = trace.Tracer(nil)
