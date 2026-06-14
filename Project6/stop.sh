#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "Stopping Mine Digital Twin Safety System..."

pkill -f "uvicorn main:app" 2>/dev/null && echo "  FastAPI server stopped" || echo "  FastAPI server not running"

if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
        docker compose down 2>/dev/null && echo "  Flink cluster stopped" || echo "  Flink cluster not running"
    fi
fi

echo "All services stopped."
