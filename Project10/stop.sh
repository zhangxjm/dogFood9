#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DATA_DIR="$PROJECT_DIR/backend/data"

echo "Stopping Ancient Book Collation System..."

if [ -f "$DATA_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$DATA_DIR/backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo "Backend (PID: $BACKEND_PID) stopped"
    else
        echo "Backend process not running"
    fi
    rm -f "$DATA_DIR/backend.pid"
else
    echo "Backend PID file not found"
fi

if [ -f "$DATA_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$DATA_DIR/frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo "Frontend (PID: $FRONTEND_PID) stopped"
    else
        echo "Frontend process not running"
    fi
    rm -f "$DATA_DIR/frontend.pid"
else
    echo "Frontend PID file not found"
fi

pkill -f "python run.py" 2>/dev/null || true
pkill -f "vue-cli-service" 2>/dev/null || true

echo "All services stopped."
