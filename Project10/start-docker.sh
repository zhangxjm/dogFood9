#!/bin/bash

set -e

echo "============================================"
echo "Ancient Book Collation System - Docker Start"
echo "============================================"
echo ""

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$PROJECT_DIR/backend/data"

mkdir -p "$DATA_DIR"
mkdir -p "$DATA_DIR/uploads"

echo "[1/3] Building Docker images..."
cd "$PROJECT_DIR"
docker-compose build

echo ""
echo "[2/3] Starting containers..."
docker-compose up -d

echo ""
echo "[3/3] Initializing data..."
sleep 5
docker exec ancient-book-backend python init_data.py 2>/dev/null || echo "Data init completed (or already initialized)"

echo ""
echo "============================================"
echo "Docker containers started successfully!"
echo "============================================"
echo ""
echo "Frontend URL:    http://localhost:8080"
echo "Backend API:     http://localhost:5000"
echo "Elasticsearch:   http://localhost:9200"
echo ""
echo "To view logs:    docker-compose logs -f"
echo "To stop:         docker-compose down"
echo ""
