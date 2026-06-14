#!/bin/bash

echo "========================================="
echo "  Live Monitor System - Start Script"
echo "========================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[1/5] Checking Docker and starting Redis..."
if command -v docker &> /dev/null; then
  if [ -f "docker-compose.yml" ]; then
    docker-compose up -d redis
    echo "Redis container started successfully"
  else
    echo "Warning: docker-compose.yml not found, skipping Redis"
  fi
else
  echo "Warning: Docker not installed, Redis will not be available"
  echo "The system will run with memory cache fallback"
fi

echo ""
echo "[2/5] Installing server dependencies..."
cd "$SCRIPT_DIR/server"
if [ ! -d "node_modules" ]; then
  npm install
  echo "Server dependencies installed"
else
  echo "Server dependencies already installed"
fi

echo ""
echo "[3/5] Initializing database..."
if [ ! -f "data/live_monitor.db" ]; then
  npm run init
  echo "Database initialized with sample data"
else
  echo "Database already exists"
fi

echo ""
echo "[4/5] Installing client dependencies..."
cd "$SCRIPT_DIR/client"
if [ ! -d "node_modules" ]; then
  npm install
  echo "Client dependencies installed"
else
  echo "Client dependencies already installed"
fi

echo ""
echo "[5/5] Starting services..."

cd "$SCRIPT_DIR/server"
if [ -f ".env" ]; then
  echo "Server .env found"
else
  cp .env.example .env
  echo "Server .env created from example"
fi

echo ""
echo "========================================="
echo "  Starting backend server..."
echo "  Port: 3001"
echo "========================================="

cd "$SCRIPT_DIR/server"
npm start &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

sleep 3

echo ""
echo "========================================="
echo "  Starting frontend server..."
echo "  Port: 3000"
echo "========================================="

cd "$SCRIPT_DIR/client"
npm run dev &
CLIENT_PID=$!
echo "Client PID: $CLIENT_PID"

echo ""
echo "========================================="
echo "  All services started!"
echo "========================================="
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:3001"
echo "  WebSocket: ws://localhost:3001/ws"
echo "  Redis:     localhost:6379"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "========================================="

trap "echo ''; echo 'Stopping services...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; if command -v docker-compose &> /dev/null; then cd $SCRIPT_DIR && docker-compose down; fi; echo 'All services stopped'; exit" INT

wait
