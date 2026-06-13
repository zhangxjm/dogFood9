#!/bin/bash
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "Stopping Smart Grid application..."
pkill -f "reactive-power-control-1.0.0.jar" 2>/dev/null || true

echo "Stopping Redis..."
docker-compose down

echo "All services stopped."
