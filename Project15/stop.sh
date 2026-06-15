#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Stopping Online Exam System services..."

echo "Stopping Redis container..."
if docker ps --format '{{.Names}}' | grep -q '^exam-redis$'; then
    docker stop exam-redis
    echo "  -> Redis stopped"
else
    echo "  -> Redis not running"
fi

echo "Stopping Java backend..."
PIDS=$(pgrep -f "exam-system-1.0.0.jar" || true)
if [ -n "$PIDS" ]; then
    kill $PIDS 2>/dev/null
    sleep 2
    PIDS=$(pgrep -f "exam-system-1.0.0.jar" || true)
    if [ -n "$PIDS" ]; then
        kill -9 $PIDS
    fi
    echo "  -> Backend stopped"
else
    echo "  -> Backend not running"
fi

echo "Stopping Vite frontend..."
PIDS=$(pgrep -f "vite" || true)
if [ -n "$PIDS" ]; then
    kill $PIDS 2>/dev/null
    sleep 1
    echo "  -> Frontend stopped"
else
    echo "  -> Frontend not running"
fi

echo ""
echo "All services stopped."
