#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$PROJECT_DIR/data"
LOG_DIR="$PROJECT_DIR/logs"

mkdir -p "$DATA_DIR" "$LOG_DIR"

echo "========================================="
echo "  Bonded Warehouse System - Startup"
echo "========================================="

command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not found"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "ERROR: docker-compose not found"; exit 1; }
command -v mvn >/dev/null 2>&1 || { echo "ERROR: maven not found"; exit 1; }
command -v java >/dev/null 2>&1 || { echo "ERROR: java not found"; exit 1; }

echo "[1/5] Starting Nacos server..."
cd "$PROJECT_DIR"
docker-compose up -d

echo "[2/5] Waiting for Nacos to be ready..."
RETRY=0
MAX_RETRY=60
while [ $RETRY -lt $MAX_RETRY ]; do
    if curl -s http://127.0.0.1:8848/nacos/v1/cs/configs?dataId=&group=&tenant= > /dev/null 2>&1; then
        echo "Nacos is ready."
        break
    fi
    RETRY=$((RETRY + 1))
    echo "Waiting for Nacos... ($RETRY/$MAX_RETRY)"
    sleep 2
done

if [ $RETRY -eq $MAX_RETRY ]; then
    echo "ERROR: Nacos failed to start within timeout."
    exit 1
fi

echo "[3/5] Building project..."
cd "$PROJECT_DIR"
mvn clean package -DskipTests -q

echo "[4/5] Starting services..."

PID_DIR="$PROJECT_DIR/pids"
mkdir -p "$PID_DIR"

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
    local log_file="$LOG_DIR/${name}.log"

    stop_service "$name"

    echo "Starting $name on port $port..."
    nohup java -jar "$jar" \
        --server.port="$port" \
        --spring.cloud.nacos.discovery.server-addr=127.0.0.1:8848 \
        > "$log_file" 2>&1 &
    echo $! > "$PID_DIR/${name}.pid"
}

start_service "warehouse-service" "$PROJECT_DIR/warehouse-service/target/warehouse-service-1.0.0.jar" 9001
start_service "customs-service" "$PROJECT_DIR/customs-service/target/customs-service-1.0.0.jar" 9002
start_service "order-service" "$PROJECT_DIR/order-service/target/order-service-1.0.0.jar" 9003
start_service "gateway" "$PROJECT_DIR/gateway/target/gateway-1.0.0.jar" 9000

echo "[5/5] Waiting for services to register..."
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
echo "  Nacos Console:      http://localhost:8848/nacos"
echo ""
echo "  Web UI:             http://localhost:9000"
echo ""
echo "  Port List:"
echo "    9000 - API Gateway (Spring Cloud Gateway + WAF)"
echo "    9001 - Warehouse Service"
echo "    9002 - Customs Service"
echo "    9003 - Order Service"
echo "    8848 - Nacos Server"
echo "    9848 - Nacos gRPC"
echo ""
echo "  Logs: $LOG_DIR/"
echo "  Data: $DATA_DIR/"
echo "========================================="
