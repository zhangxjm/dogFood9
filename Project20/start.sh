#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$PROJECT_DIR/server"
CLIENT_DIR="$PROJECT_DIR/client"
LOG_DIR="$PROJECT_DIR/logs"

mkdir -p "$LOG_DIR"

SERVER_PID_FILE="$LOG_DIR/server.pid"
CLIENT_PID_FILE="$LOG_DIR/client.pid"

cleanup() {
  echo "Stopping services..."
  if [ -f "$SERVER_PID_FILE" ]; then
    SERVER_PID=$(cat "$SERVER_PID_FILE")
    if kill -0 "$SERVER_PID" 2>/dev/null; then
      kill "$SERVER_PID" 2>/dev/null || true
      echo "Server stopped (PID: $SERVER_PID)"
    fi
    rm -f "$SERVER_PID_FILE"
  fi
  if [ -f "$CLIENT_PID_FILE" ]; then
    CLIENT_PID=$(cat "$CLIENT_PID_FILE")
    if kill -0 "$CLIENT_PID" 2>/dev/null; then
      kill "$CLIENT_PID" 2>/dev/null || true
      echo "Client stopped (PID: $CLIENT_PID)"
    fi
    rm -f "$CLIENT_PID_FILE"
  fi
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo "============================================"
echo "  Collaborative Whiteboard System"
echo "============================================"
echo ""

echo "[1/5] Checking Node.js..."
if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js is not installed. Please install Node.js v18+."
  exit 1
fi
NODE_VERSION=$(node -v)
echo "  Node.js version: $NODE_VERSION"
echo ""

echo "[2/5] Checking server dependencies..."
cd "$SERVER_DIR"
if [ ! -d "node_modules" ]; then
  echo "  Installing server dependencies..."
  npm install --silent
fi
echo "  Server dependencies ready."
echo ""

echo "[3/5] Checking client dependencies..."
cd "$CLIENT_DIR"
if [ ! -d "node_modules" ]; then
  echo "  Installing client dependencies..."
  npm install --silent
fi
echo "  Client dependencies ready."
echo ""

echo "[4/5] Starting server..."
cd "$SERVER_DIR"
SERVER_LOG="$LOG_DIR/server.log"
rm -f "$SERVER_LOG"
nohup node index.js > "$SERVER_LOG" 2>&1 &
echo $! > "$SERVER_PID_FILE"
SERVER_PID=$(cat "$SERVER_PID_FILE")
sleep 3
if kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "  Server started successfully (PID: $SERVER_PID)"
  echo "  Server URL: http://localhost:3001"
  echo "  Health check: http://localhost:3001/api/health"
else
  echo "  ERROR: Failed to start server. Check $SERVER_LOG"
  exit 1
fi
echo ""

echo "[5/5] Starting client..."
cd "$CLIENT_DIR"
CLIENT_LOG="$LOG_DIR/client.log"
rm -f "$CLIENT_LOG"
nohup npx vite --host 0.0.0.0 > "$CLIENT_LOG" 2>&1 &
echo $! > "$CLIENT_PID_FILE"
CLIENT_PID=$(cat "$CLIENT_PID_FILE")
sleep 5
if kill -0 "$CLIENT_PID" 2>/dev/null; then
  echo "  Client started successfully (PID: $CLIENT_PID)"
  echo "  Client URL: http://localhost:5173"
else
  echo "  ERROR: Failed to start client. Check $CLIENT_LOG"
  exit 1
fi
echo ""

echo "============================================"
echo "  All services started successfully!"
echo "============================================"
echo ""
echo "  Access URLs:"
echo "    - Frontend:  http://localhost:5173"
echo "    - Backend:   http://localhost:3001"
echo "    - API Docs:  http://localhost:3001/"
echo ""
echo "  Default account:"
echo "    - Username:  admin"
echo "    - Password:  admin123"
echo ""
echo "  Log files:"
echo "    - Server:    $LOG_DIR/server.log"
echo "    - Client:    $LOG_DIR/client.log"
echo ""
echo "  Press Ctrl+C to stop all services."
echo "============================================"

while true; do
  sleep 1
done
