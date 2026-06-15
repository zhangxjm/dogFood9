#!/bin/bash

set -e

echo "============================================"
echo "Delivery Route Optimization System"
echo "Starting all services locally..."
echo "============================================"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "[1/2] Starting Backend (port 8080)..."
"$SCRIPT_DIR/start-backend.sh" &
BACKEND_PID=$!

sleep 3

echo ""
echo "[2/2] Starting Frontend (port 3000)..."
"$SCRIPT_DIR/start-frontend.sh" &
FRONTEND_PID=$!

echo ""
echo "============================================"
echo "Services started!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"
echo "============================================"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

wait
