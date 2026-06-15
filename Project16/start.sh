#!/bin/bash

set -e

echo "=========================================="
echo "Hotel IoT Control System - Startup Script"
echo "=========================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo ""
echo "[1/5] Checking directory structure..."
if [ ! -d "$BACKEND_DIR" ]; then
    echo "ERROR: Backend directory not found at $BACKEND_DIR"
    exit 1
fi
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "ERROR: Frontend directory not found at $FRONTEND_DIR"
    exit 1
fi
echo "OK - Directory structure verified"

echo ""
echo "[2/5] Installing backend dependencies..."
cd "$BACKEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages for backend..."
    npm install
else
    echo "Dependencies already installed, skipping..."
fi
echo "OK - Backend dependencies ready"

echo ""
echo "[3/5] Initializing database and seed data..."
if [ ! -d "data" ]; then
    mkdir -p data
    echo "Created data directory"
fi
if [ ! -f "data/hotel_iot.db" ]; then
    echo "Running database seed..."
    npm run seed
else
    echo "Database already exists, skipping seed..."
fi
echo "OK - Database initialized"

echo ""
echo "[4/5] Installing frontend dependencies..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages for frontend..."
    npm install
else
    echo "Dependencies already installed, skipping..."
fi
echo "OK - Frontend dependencies ready"

echo ""
echo "[5/5] Starting backend server..."
cd "$BACKEND_DIR"
echo "Starting NestJS server on port 3000..."
echo ""
echo "=========================================="
echo "System is starting up..."
echo ""
echo "Backend API:    http://localhost:3000/api"
echo "WebSocket:      ws://localhost:3000"
echo "Backend Port:   3000"
echo ""
echo "To start frontend (in new terminal):"
echo "  cd $FRONTEND_DIR"
echo "  npm run web"
echo ""
echo "Press Ctrl+C to stop the backend server"
echo "=========================================="
echo ""

npm run start:dev
