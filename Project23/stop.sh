#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Stopping Industrial Monitoring System..."

if [ -f "$SCRIPT_DIR/backend/server.pid" ]; then
    BACKEND_PID=$(cat "$SCRIPT_DIR/backend/server.pid")
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "Stopping backend service (PID: $BACKEND_PID)..."
        kill "$BACKEND_PID"
        echo "Backend stopped."
    fi
    rm -f "$SCRIPT_DIR/backend/server.pid"
fi

if [ -f "$SCRIPT_DIR/frontend/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$SCRIPT_DIR/frontend/frontend.pid")
    if kill -0 "$FRONTEND_PID" 2>/dev/null; then
        echo "Stopping frontend service (PID: $FRONTEND_PID)..."
        kill "$FRONTEND_PID"
        echo "Frontend stopped."
    fi
    rm -f "$SCRIPT_DIR/frontend/frontend.pid"
fi

echo "System stopped."
