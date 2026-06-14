#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PID_FILE="$PROJECT_DIR/.running.pids"

echo "Stopping Smart Parking System..."

if [ -f "$PID_FILE" ]; then
    source "$PID_FILE"

    if [ -n "$backend_pid" ]; then
        if kill -0 $backend_pid 2>/dev/null; then
            kill $backend_pid
            echo "  Backend (PID $backend_pid) stopped"
        else
            echo "  Backend not running"
        fi
    fi

    if [ -n "$frontend_pid" ]; then
        if kill -0 $frontend_pid 2>/dev/null; then
            kill $frontend_pid
            echo "  Frontend (PID $frontend_pid) stopped"
        else
            echo "  Frontend not running"
        fi
    fi

    rm -f "$PID_FILE"
else
    echo "  No PID file found. Trying to kill by port..."
    BACKEND_PID=$(lsof -ti:8080 2>/dev/null || true)
    FRONTEND_PID=$(lsof -ti:3000 2>/dev/null || lsof -ti:3003 2>/dev/null || true)

    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "  Backend stopped"
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "  Frontend stopped"
    fi
fi

if command -v docker &> /dev/null && [ -f "$PROJECT_DIR/docker-compose.yml" ]; then
    cd "$PROJECT_DIR"
    docker compose down 2>/dev/null || true
    echo "  Docker containers stopped"
fi

echo "All services stopped."
