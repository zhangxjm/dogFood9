#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "  Industrial Monitoring System Startup Script"
echo "============================================"
echo ""

check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "[ERROR] $1 is not installed. Please install $1 first."
        exit 1
    fi
}

echo "[1/6] Checking required dependencies..."
check_command go
check_command node
check_command npm
echo "Dependencies check passed."
echo ""

echo "[2/6] Building backend service..."
cd "$SCRIPT_DIR/backend"
if [ ! -f "go.sum" ]; then
    echo "Downloading Go modules..."
    go mod download
fi
echo "Building Go binary..."
go build -o server ./cmd/server
echo "Backend build completed."
echo ""

echo "[3/6] Installing frontend dependencies..."
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
fi
echo "Frontend dependencies ready."
echo ""

echo "[4/6] Building frontend..."
cd "$SCRIPT_DIR/frontend"
if [ ! -d "dist" ]; then
    echo "Building frontend..."
    npm run build
fi
echo "Frontend build completed."
echo ""

echo "[5/6] Starting backend service on port 8080..."
cd "$SCRIPT_DIR/backend"
if [ -f "server.pid" ]; then
    OLD_PID=$(cat server.pid)
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Stopping old backend process (PID: $OLD_PID)..."
        kill "$OLD_PID"
        sleep 1
    fi
    rm -f server.pid
fi

nohup ./server > backend.log 2>&1 &
echo $! > server.pid
sleep 2

BACKEND_PID=$(cat server.pid)
if kill -0 "$BACKEND_PID" 2>/dev/null; then
    echo "Backend started successfully (PID: $BACKEND_PID)"
else
    echo "[ERROR] Backend failed to start. Check backend.log for details."
    exit 1
fi
echo ""

echo "[6/6] Starting frontend static server on port 5173..."
cd "$SCRIPT_DIR/frontend"
if [ -f "frontend.pid" ]; then
    OLD_PID=$(cat frontend.pid)
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Stopping old frontend process (PID: $OLD_PID)..."
        kill "$OLD_PID"
        sleep 1
    fi
    rm -f frontend.pid
fi

nohup npx serve -s dist -l 5173 > frontend.log 2>&1 &
echo $! > frontend.pid
sleep 3

FRONTEND_PID=$(cat frontend.pid)
if kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "Frontend started successfully (PID: $FRONTEND_PID)"
else
    echo "[ERROR] Frontend failed to start. Check frontend.log for details."
    exit 1
fi
echo ""

echo "============================================"
echo "  System startup completed!"
echo "============================================"
echo "  Frontend URL: http://localhost:5173"
echo "  Backend API: http://localhost:8080"
echo "  WebSocket:  ws://localhost:8080/ws"
echo "============================================"
echo ""
echo "To stop the system, run: ./stop.sh"
