#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
DATA_DIR="$PROJECT_DIR/data"
LOG_DIR="$PROJECT_DIR/logs"

echo "=========================================="
echo "  Smart Parking Management System"
echo "  Starting up..."
echo "=========================================="

mkdir -p "$DATA_DIR"
mkdir -p "$LOG_DIR"

echo ""
echo "[1/6] Checking environment..."
if ! command -v java &> /dev/null; then
    echo "ERROR: Java is not installed. Please install Java 17+."
    exit 1
fi
if ! command -v mvn &> /dev/null; then
    echo "ERROR: Maven is not installed. Please install Maven."
    exit 1
fi
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed. Please install Node.js 18+."
    exit 1
fi
echo "  Java: $(java -version 2>&1 | head -1)"
echo "  Maven: $(mvn -version 2>&1 | head -1)"
echo "  Node.js: $(node -v)"
echo "  OK"

echo ""
echo "[2/6] Starting Redis container (optional)..."
cd "$PROJECT_DIR"
if command -v docker &> /dev/null && docker info &> /dev/null 2>&1; then
    docker compose up -d redis 2>/dev/null || echo "  Redis skipped"
else
    echo "  Docker not running, Redis skipped"
fi

echo ""
echo "[3/6] Building Spring Boot backend..."
cd "$BACKEND_DIR"
mvn clean package -DskipTests -q
echo "  Build complete: target/smart-parking-1.0.0.jar"

echo ""
echo "[4/6] Starting Spring Boot backend..."
cd "$BACKEND_DIR"
nohup java -jar target/smart-parking-1.0.0.jar > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"
echo "  Waiting for backend to start..."

BACKEND_READY=0
for i in $(seq 1 30); do
    if curl -s http://localhost:8080/api/dashboard/overview > /dev/null 2>&1; then
        BACKEND_READY=1
        break
    fi
    sleep 1
done

if [ $BACKEND_READY -eq 1 ]; then
    echo "  Backend is ready on port 8080"
else
    echo "  WARNING: Backend may not be ready yet. Check logs/backend.log"
fi

echo ""
echo "[5/6] Installing frontend dependencies..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    npm install --silent 2>/dev/null || npm install
fi
echo "  Dependencies ready"

echo ""
echo "[6/6] Starting React frontend..."
cd "$FRONTEND_DIR"
nohup npx vite --host 0.0.0.0 --port 3000 > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"
echo "  Waiting for frontend to start..."

FRONTEND_READY=0
for i in $(seq 1 20); do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        FRONTEND_READY=1
        break
    fi
    if curl -s http://localhost:3003 > /dev/null 2>&1; then
        FRONTEND_READY=1
        break
    fi
    sleep 1
done

echo ""
echo "=========================================="
echo "  System Started Successfully!"
echo "=========================================="
echo ""
echo "  Backend API:   http://localhost:8080/api"
echo "  WebSocket:     ws://localhost:8080/ws/parking"
echo "  Admin Panel:   http://localhost:3000/admin"
echo "  Owner Portal:  http://localhost:3000/"
if command -v docker &> /dev/null && docker ps --format '{{.Names}}' | grep -q smart-parking-redis; then
    echo "  Redis:         localhost:6379"
fi
echo ""
echo "  Logs:"
echo "    Backend: $LOG_DIR/backend.log"
echo "    Frontend: $LOG_DIR/frontend.log"
echo ""
echo "  PIDs:"
echo "    Backend: $BACKEND_PID"
echo "    Frontend: $FRONTEND_PID"
echo ""
echo "  To stop: kill $BACKEND_PID $FRONTEND_PID"
echo "  Or use ./stop.sh"
echo "=========================================="

echo "backend_pid=$BACKEND_PID" > "$PROJECT_DIR/.running.pids"
echo "frontend_pid=$FRONTEND_PID" >> "$PROJECT_DIR/.running.pids"
