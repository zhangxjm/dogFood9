#!/bin/bash

set -e

echo "=========================================="
echo "Hotel IoT System - Docker Startup"
echo "=========================================="

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"

echo ""
echo "[1/4] Creating data directory..."
cd "$ROOT_DIR"
mkdir -p backend/data
echo "OK"

echo ""
echo "[2/4] Initializing seed data..."
cd "$BACKEND_DIR"
if [ ! -d "node_modules" ]; then
    npm install
fi
if [ ! -f "data/hotel_iot.db" ]; then
    npm run seed
fi
echo "OK"

echo ""
echo "[3/4] Building and starting containers..."
cd "$ROOT_DIR"
docker-compose up -d --build
echo "OK"

echo ""
echo "[4/4] Verifying services..."
sleep 3
docker-compose ps

echo ""
echo "=========================================="
echo "Docker services started successfully!"
echo ""
echo "Backend API:    http://localhost:3000/api"
echo "WebSocket:      ws://localhost:3000"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
echo "To stop services:"
echo "  docker-compose down"
echo "=========================================="
