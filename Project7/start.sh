#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

DATA_DIR="$PROJECT_DIR/data"
mkdir -p "$DATA_DIR"

echo "========================================="
echo " Government Data Sharing Platform"
echo " Build & Start Script"
echo "========================================="

MODE="${1:-local}"

check_go() {
    if ! command -v go &> /dev/null; then
        echo "Error: Go is not installed"
        exit 1
    fi
    echo "[OK] Go version: $(go version)"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "Error: Docker is not installed"
        exit 1
    fi
    echo "[OK] Docker version: $(docker --version)"
}

build_services() {
    echo ""
    echo "[1/3] Downloading dependencies..."
    go mod tidy

    echo ""
    echo "[2/3] Building services..."
    CGO_ENABLED=1 go build -o bin/api-gateway ./cmd/api-gateway
    echo "  [OK] api-gateway built"
    CGO_ENABLED=1 go build -o bin/data-catalog-service ./cmd/data-catalog
    echo "  [OK] data-catalog-service built"
    CGO_ENABLED=1 go build -o bin/auth-service ./cmd/auth-service
    echo "  [OK] auth-service built"
    CGO_ENABLED=1 go build -o bin/audit-service ./cmd/audit-service
    echo "  [OK] audit-service built"
    CGO_ENABLED=1 go build -o bin/exchange-service ./cmd/exchange-service
    echo "  [OK] exchange-service built"

    echo ""
    echo "[3/3] Build completed!"
}

start_consul_local() {
    if command -v consul &> /dev/null; then
        if ! pgrep -x "consul" > /dev/null 2>&1; then
            echo "Starting Consul agent in dev mode..."
            consul agent -dev -client=0.0.0.0 > "$DATA_DIR/consul.log" 2>&1 &
            sleep 3
            echo "[OK] Consul started on http://localhost:8500"
        else
            echo "[OK] Consul is already running"
        fi
    else
        echo "[WARN] Consul not found locally. Running without service discovery."
    fi
}

start_services_local() {
    echo ""
    echo "Starting services in local mode..."
    echo ""

    export CONSUL_ADDR=127.0.0.1:8500

    echo "Starting API Gateway on port 8080..."
    SERVICE_PORT=8080 ./bin/api-gateway > "$DATA_DIR/api-gateway.log" 2>&1 &
    API_PID=$!
    sleep 2

    echo "Starting Data Catalog Service on port 8081..."
    SERVICE_PORT=8081 ./bin/data-catalog-service > "$DATA_DIR/data-catalog.log" 2>&1 &
    CATALOG_PID=$!

    echo "Starting Auth Service on port 8082..."
    SERVICE_PORT=8082 ./bin/auth-service > "$DATA_DIR/auth-service.log" 2>&1 &
    AUTH_PID=$!

    echo "Starting Audit Service on port 8083..."
    SERVICE_PORT=8083 ./bin/audit-service > "$DATA_DIR/audit-service.log" 2>&1 &
    AUDIT_PID=$!

    echo "Starting Exchange Service on port 8084..."
    SERVICE_PORT=8084 ./bin/exchange-service > "$DATA_DIR/exchange-service.log" 2>&1 &
    EXCHANGE_PID=$!

    echo ""
    echo "========================================="
    echo " All services started successfully!"
    echo "========================================="
    echo ""
    echo "  Web UI:         http://localhost:8080"
    echo "  API Gateway:    http://localhost:8080"
    echo "  Data Catalog:   http://localhost:8081"
    echo "  Auth Service:   http://localhost:8082"
    echo "  Audit Service:  http://localhost:8083"
    echo "  Exchange Svc:   http://localhost:8084"
    echo "  Consul UI:      http://localhost:8500"
    echo ""
    echo "  Default login:  admin / admin123"
    echo ""
    echo "  PIDs: Gateway=$API_PID Catalog=$CATALOG_PID Auth=$AUTH_PID Audit=$AUDIT_PID Exchange=$EXCHANGE_PID"
    echo ""

    echo $API_PID > "$DATA_DIR/api-gateway.pid"
    echo $CATALOG_PID > "$DATA_DIR/data-catalog.pid"
    echo $AUTH_PID > "$DATA_DIR/auth-service.pid"
    echo $AUDIT_PID > "$DATA_DIR/audit-service.pid"
    echo $EXCHANGE_PID > "$DATA_DIR/exchange-service.pid"

    echo "Press Ctrl+C to stop all services..."
    trap "echo 'Stopping services...'; kill $API_PID $CATALOG_PID $AUTH_PID $AUDIT_PID $EXCHANGE_PID 2>/dev/null; exit 0" SIGINT SIGTERM

    wait
}

start_docker() {
    check_docker
    echo ""
    echo "Starting services with Docker Compose..."
    docker-compose up --build -d

    echo ""
    echo "========================================="
    echo " All services started (Docker mode)!"
    echo "========================================="
    echo ""
    echo "  Web UI:         http://localhost:8080"
    echo "  Envoy Proxy:    http://localhost:9901"
    echo "  Consul UI:      http://localhost:8500"
    echo "  Envoy Admin:    http://localhost:9900"
    echo ""
    echo "  Default login:  admin / admin123"
    echo ""
    echo "  To stop: docker-compose down"
}

stop_local() {
    echo "Stopping local services..."
    for pidfile in "$DATA_DIR"/*.pid; do
        if [ -f "$pidfile" ]; then
            pid=$(cat "$pidfile")
            kill "$pid" 2>/dev/null && echo "  Stopped PID $pid"
            rm "$pidfile"
        fi
    done
    echo "[OK] All services stopped"
}

stop_docker() {
    echo "Stopping Docker services..."
    docker-compose down
    echo "[OK] All Docker services stopped"
}

case "$MODE" in
    local)
        check_go
        mkdir -p bin
        build_services
        start_consul_local
        start_services_local
        ;;
    docker)
        start_docker
        ;;
    stop)
        stop_local
        stop_docker
        ;;
    build)
        check_go
        mkdir -p bin
        build_services
        ;;
    *)
        echo "Usage: $0 {local|docker|stop|build}"
        echo ""
        echo "  local  - Build and run all services locally (default)"
        echo "  docker - Build and run with Docker Compose"
        echo "  stop   - Stop all running services"
        echo "  build  - Build all services only"
        exit 1
        ;;
esac
