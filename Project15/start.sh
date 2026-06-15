#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "  Online Exam System - Starting Up"
echo "=========================================="
echo ""

echo "[1/6] Checking environment..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed or not in PATH"
    exit 1
fi

if ! command -v mvn &> /dev/null; then
    echo "ERROR: Maven is not installed or not in PATH"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed or not in PATH"
    exit 1
fi
echo "  -> Environment OK"

echo ""
echo "[2/6] Starting Docker middleware..."
if docker ps -a --format '{{.Names}}' | grep -q '^exam-redis$'; then
    if docker ps --format '{{.Names}}' | grep -q '^exam-redis$'; then
        echo "  -> Redis is already running"
    else
        docker start exam-redis
        echo "  -> Redis container started"
    fi
else
    docker compose up -d redis
    echo "  -> Redis container created and started"
fi

sleep 3

echo ""
echo "[3/6] Building backend..."
cd "$SCRIPT_DIR/backend"
mkdir -p data
mvn clean package -DskipTests -q
echo "  -> Backend build completed"

echo ""
echo "[4/6] Installing frontend dependencies..."
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install
    echo "  -> Frontend dependencies installed"
else
    echo "  -> Frontend dependencies already installed"
fi

echo ""
echo "[5/6] Building frontend..."
npm run build -s 2>/dev/null || npm run build
echo "  -> Frontend build completed"

echo ""
echo "[6/6] Starting services..."
cd "$SCRIPT_DIR"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    echo "Stopping services..."
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID 2>/dev/null
    wait $FRONTEND_PID 2>/dev/null
    echo "All services stopped."
    exit 0
}
trap cleanup INT TERM

cd "$SCRIPT_DIR/backend"
echo "  -> Starting backend (port 8080)..."
java -jar target/exam-system-1.0.0.jar &
BACKEND_PID=$!

cd "$SCRIPT_DIR/frontend"
echo "  -> Starting frontend (port 3000)..."
npm run preview &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "  System Started Successfully!"
echo "=========================================="
echo ""
echo "  Service URLs:"
echo "  - Frontend:        http://localhost:3000"
echo "  - Backend API:     http://localhost:8080/api"
echo "  - Redis:           localhost:6379"
echo ""
echo "  Default Accounts:"
echo "  - Teacher:         teacher  / teacher123"
echo "  - Student:         student1 / student123"
echo "  - Admin:           admin    / admin123"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "=========================================="

wait $BACKEND_PID $FRONTEND_PID
