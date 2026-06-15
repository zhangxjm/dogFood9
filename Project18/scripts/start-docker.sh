#!/bin/bash

set -e

echo "============================================"
echo "Delivery Route Optimization System"
echo "============================================"
echo ""

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR/.."

echo "[1/4] Checking environment..."
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Please install Docker first."
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose not found."
    exit 1
fi

echo "[2/4] Creating data directories..."
mkdir -p "$PROJECT_DIR/backend/data"

echo "[3/4] Building and starting services..."
cd "$PROJECT_DIR"

if command -v docker compose &> /dev/null; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi

echo ""
echo "[4/4] Waiting for services to be ready..."
sleep 5

echo ""
echo "============================================"
echo "Services started successfully!"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8080"
echo "Backend Health: http://localhost:8080/health"
echo ""
echo "To stop services, run: ./scripts/stop-docker.sh"
echo "============================================"
