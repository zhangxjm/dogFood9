#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "Stopping Fraud Detection System"
echo "=========================================="

if command -v lsof &> /dev/null; then
    echo ""
    echo "Stopping backend service (port 8000)..."
    BACKEND_PID=$(lsof -ti:8000 2>/dev/null || echo "")
    if [ -n "$BACKEND_PID" ]; then
        kill -9 $BACKEND_PID 2>/dev/null || true
        echo "Backend stopped (PID: $BACKEND_PID)"
    else
        echo "Backend service is not running"
    fi

    echo ""
    echo "Stopping frontend service (port 5173)..."
    FRONTEND_PID=$(lsof -ti:5173 2>/dev/null || echo "")
    if [ -n "$FRONTEND_PID" ]; then
        kill -9 $FRONTEND_PID 2>/dev/null || true
        echo "Frontend stopped (PID: $FRONTEND_PID)"
    else
        echo "Frontend service is not running"
    fi
else
    echo "Warning: lsof not found, trying to find processes by name..."
    
    pkill -f "uvicorn.*8000" 2>/dev/null || true
    pkill -f "vite.*5173" 2>/dev/null || true
    echo "Processes stopped (if running)"
fi

echo ""
echo "=========================================="
echo "All services stopped"
echo "=========================================="
