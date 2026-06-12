#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$PROJECT_DIR/data"
LOG_DIR="$PROJECT_DIR/logs"
PID_DIR="$PROJECT_DIR/pids"

mkdir -p "$DATA_DIR" "$LOG_DIR" "$PID_DIR"

echo "========================================="
echo "  Bonded Warehouse System - Startup"
echo "========================================="

command -v mvn >/dev/null 2>&1 || { echo "ERROR: maven not found"; exit 1; }
command -v java >/dev/null 2>&1 || { echo "ERROR: java not found"; exit 1; }

stop_service() {
    local name=$1
    local pid_file="$PID_DIR/${name}.pid"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping $name (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            sleep 2
        fi
        rm -f "$pid_file"
    fi
}

start_service() {
    local name=$1
    local jar=$2
    local port=$3
    local profile=$4
    local log_file="$LOG_DIR/${name}.log"

    stop_service "$name"

    echo "Starting $name on port $port..."
    nohup java -jar "$jar" \
        --server.port="$port" \
        --spring.profiles.active="$profile" \
        > "$log_file" 2>&1 &
    echo $! > "$PID_DIR/${name}.pid"
}

echo "[1/3] Building project..."
cd "$PROJECT_DIR"
mvn clean package -DskipTests -q

echo "[2/3] Starting services..."

start_service "warehouse-service" "$PROJECT_DIR/warehouse-service/target/warehouse-service-1.0.0.jar" 9001 "simple"
start_service "customs-service" "$PROJECT_DIR/customs-service/target/customs-service-1.0.0.jar" 9002 "simple"
start_service "order-service" "$PROJECT_DIR/order-service/target/order-service-1.0.0.jar" 9003 "simple"
start_service "gateway" "$PROJECT_DIR/gateway/target/gateway-1.0.0.jar" 9000 "simple"

echo "[3/3] Waiting for services to be ready..."
sleep 15

echo ""
echo "========================================="
echo "  All services started successfully!"
echo "========================================="
echo ""
echo "  Gateway:            http://localhost:9000"
echo "  Warehouse Service:  http://localhost:9001"
echo "  Customs Service:    http://localhost:9002"
echo "  Order Service:      http://localhost:9003"
echo ""
echo "  Web UI:             http://localhost:9000"
echo ""
echo "  Port List:"
echo "    9000 - API Gateway (Spring Cloud Gateway + WAF)"
echo "    9001 - Warehouse Service"
echo "    9002 - Customs Service"
echo "    9003 - Order Service"
echo "    8848 - Nacos Server (optional, start with docker-compose)"
echo "    9848 - Nacos gRPC (optional)"
echo ""
echo "  Logs: $LOG_DIR/"
echo "  Data: $DATA_DIR/"
echo "========================================="
