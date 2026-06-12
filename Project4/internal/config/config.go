package config

import (
	"os"
	"strconv"
)

type Config struct {
	GRPCPort        string
	HTTPPort        string
	SQLitePath      string
	RedisAddr       string
	RedisPassword   string
	RedisDB         int
	JaegerEndpoint  string
	ServiceName     string
	ServiceVersion  string
	Environment     string
}

func Load() *Config {
	return &Config{
		GRPCPort:       getEnv("GRPC_PORT", "9090"),
		HTTPPort:       getEnv("HTTP_PORT", "8080"),
		SQLitePath:     getEnv("SQLITE_PATH", "./data/firefighting.db"),
		RedisAddr:      getEnv("REDIS_ADDR", "localhost:6379"),
		RedisPassword:  getEnv("REDIS_PASSWORD", ""),
		RedisDB:        getEnvInt("REDIS_DB", 0),
		JaegerEndpoint: getEnv("JAEGER_ENDPOINT", "localhost:4317"),
		ServiceName:    getEnv("SERVICE_NAME", "fire-fighting-twin"),
		ServiceVersion: getEnv("SERVICE_VERSION", "1.0.0"),
		Environment:    getEnv("ENVIRONMENT", "development"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}
