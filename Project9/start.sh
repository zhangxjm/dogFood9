#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "========================================"
echo "  Industrial Equipment Lifecycle Management System"
echo "  Starting all services..."
echo "========================================"
echo ""

echo "[1/5] Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed or not running"
    exit 1
fi
echo "  Docker is available"
echo ""

echo "[2/5] Starting Redis container..."
cd "$SCRIPT_DIR"
if docker ps -a --format '{{.Names}}' | grep -q '^equipment-redis$'; then
    echo "  Redis container exists, starting..."
    docker start equipment-redis 2>/dev/null || true
else
    echo "  Creating and starting Redis container..."
    docker compose up -d redis
fi
echo "  Redis is starting on port 6379"
echo ""

echo "[3/5] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    exit 1
fi
echo "  Node.js version: $(node --version)"
echo ""

echo "[4/5] Installing backend dependencies..."
cd "$BACKEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "  Installing npm packages..."
    npm install
    echo "  Dependencies installed successfully"
else
    echo "  Dependencies already exist"
fi
echo ""

echo "[5/5] Starting the application..."
echo ""
echo "========================================"
echo "  Service Port List:"
echo "  - Web UI:         http://localhost:3000"
echo "  - API Server:     http://localhost:3000/api"
echo "  - Redis:          localhost:6379"
echo ""
echo "  Press Ctrl+C to stop the server"
echo "========================================"
echo ""

cd "$BACKEND_DIR"
exec npm start
