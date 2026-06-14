#!/bin/bash

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND_PORT=9000
FRONTEND_PORT=3000

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

cleanup() {
    echo ""
    echo "Stopping services..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    sleep 1
    echo "Services stopped"
    exit 0
}

trap cleanup INT TERM

kill_port() {
    local port=$1
    if command -v lsof &> /dev/null; then
        local pids=$(lsof -ti:$port 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "Killing processes on port $port..."
            kill -9 $pids 2>/dev/null || true
            sleep 1
        fi
    fi
}

wait_for_port() {
    local port=$1
    local name=$2
    local max_attempts=30
    local attempt=1

    echo "Waiting for $name to start on port $port..."
    while [ $attempt -le $max_attempts ]; do
        if command -v nc &> /dev/null; then
            if nc -z localhost $port 2>/dev/null; then
                echo -e "${GREEN}$name is running on port $port${NC}"
                return 0
            fi
        elif command -v curl &> /dev/null; then
            if curl -s -o /dev/null -w "%{http_code}" http://localhost:$port 2>/dev/null | grep -q "200\|404\|400"; then
                echo -e "${GREEN}$name is running on port $port${NC}"
                return 0
            fi
        else
            sleep 2
            echo -e "${GREEN}$name should be running on port $port${NC}"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    echo -e "${YELLOW}Warning: $name may not have started properly${NC}"
}

echo "=========================================="
echo "Smart Irrigation System - Startup Script"
echo "=========================================="

echo ""
echo -e "${YELLOW}[1/6] Checking environment...${NC}"

if ! command -v go &> /dev/null; then
    echo -e "${RED}Error: Go is not installed${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}Go version: $(go version)${NC}"
echo -e "${GREEN}Node version: $(node --version)${NC}"
echo -e "${GREEN}npm version: $(npm --version)${NC}"

echo ""
echo -e "${YELLOW}[2/6] Cleaning up ports...${NC}"
kill_port $BACKEND_PORT
kill_port $FRONTEND_PORT
echo -e "${GREEN}Ports cleaned${NC}"

echo ""
echo -e "${YELLOW}[3/6] Installing backend dependencies...${NC}"
cd "$SCRIPT_DIR/backend"
export GOPROXY=https://goproxy.cn,direct
if [ ! -d "vendor" ] && [ ! -f "go.sum" ]; then
    go mod tidy
fi
go mod download
echo -e "${GREEN}Backend dependencies installed${NC}"

echo ""
echo -e "${YELLOW}[4/6] Installing frontend dependencies...${NC}"
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install
fi
echo -e "${GREEN}Frontend dependencies installed${NC}"

echo ""
echo -e "${YELLOW}[5/6] Starting backend server...${NC}"
cd "$SCRIPT_DIR/backend"
export GOPROXY=https://goproxy.cn,direct
go run main.go > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

wait_for_port $BACKEND_PORT "Backend"

echo ""
echo -e "${YELLOW}[6/6] Starting frontend dev server...${NC}"
cd "$SCRIPT_DIR/frontend"
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

wait_for_port $FRONTEND_PORT "Frontend"

echo ""
echo "=========================================="
echo -e "${GREEN}System started successfully!${NC}"
echo "=========================================="
echo ""
echo "Frontend URL: http://localhost:$FRONTEND_PORT"
echo "Backend API:  http://localhost:$BACKEND_PORT"
echo ""
echo "Backend log:  $SCRIPT_DIR/backend/backend.log"
echo "Frontend log: $SCRIPT_DIR/frontend/frontend.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

wait
