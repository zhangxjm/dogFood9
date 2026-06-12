#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_DIR="$PROJECT_DIR/pids"

echo "Stopping all services..."

for name in gateway warehouse-service customs-service order-service; do
    pid_file="$PID_DIR/${name}.pid"
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping $name (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
        fi
        rm -f "$pid_file"
    fi
done

cd "$PROJECT_DIR"
docker-compose down 2>/dev/null || true

echo "All services stopped."
