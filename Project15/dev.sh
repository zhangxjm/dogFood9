#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "  Online Exam System - Development Mode"
echo "=========================================="
echo ""

echo "[1/3] Starting Docker middleware..."
if docker ps -a --format '{{.Names}}' | grep -q '^exam-redis$'; then
    if ! docker ps --format '{{.Names}}' | grep -q '^exam-redis$'; then
        docker start exam-redis
    fi
else
    docker compose up -d redis
fi
echo "  -> Redis is ready"
sleep 2

echo ""
echo "[2/3] Starting backend (port 8080)..."
cd "$SCRIPT_DIR/backend"
mkdir -p data

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    echo "Stopping dev services..."
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null || true
    wait 2>/dev/null
    echo "Done."
    exit 0
}
trap cleanup INT TERM

mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005" &
BACKEND_PID=$!

echo ""
echo "[3/3] Starting frontend dev server (port 3000)..."
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    npm install
fi

sleep 10
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "  Development Environment Ready!"
echo "=========================================="
echo ""
echo "  Frontend:     http://localhost:3000 (HMR enabled)"
echo "  Backend API:  http://localhost:8080/api"
echo "  Debug Port:   5005 (Java JDWP)"
echo ""
echo "  Default Accounts:"
echo "  - Teacher:  teacher  / teacher123"
echo "  - Student:  student1 / student123"
echo ""
echo "  Press Ctrl+C to stop"
echo "=========================================="

wait $BACKEND_PID $FRONTEND_PID
