#!/bin/bash

set -e

echo "============================================"
echo "Ancient Book Collation System - Start Script"
echo "============================================"
echo ""

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
DATA_DIR="$BACKEND_DIR/data"
DATABASE_FILE="$DATA_DIR/ancient_books.db"

mkdir -p "$DATA_DIR"
mkdir -p "$DATA_DIR/uploads"

echo "[1/4] Checking Python dependencies..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt -q

echo ""
echo "[2/4] Initializing database..."
if [ ! -f "$DATABASE_FILE" ]; then
    echo "Initializing database with sample data..."
    python init_data.py
else
    echo "Database already exists, skipping initialization."
fi

echo ""
echo "[3/4] Checking Node.js dependencies..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install --registry=https://registry.npmmirror.com
fi

echo ""
echo "[4/4] Starting services..."
echo ""
echo "Starting backend server on port 5001..."
cd "$BACKEND_DIR"
source venv/bin/activate
nohup python run.py > "$DATA_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

echo "Starting frontend dev server on port 8080..."
cd "$FRONTEND_DIR"
nohup npm run serve > "$DATA_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "============================================"
echo "Services started successfully!"
echo "============================================"
echo ""
echo "Frontend URL: http://localhost:8080"
echo "Backend URL:  http://localhost:5001"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop services, run: ./stop.sh"
echo "Backend log: $DATA_DIR/backend.log"
echo "Frontend log: $DATA_DIR/frontend.log"
echo ""

echo $BACKEND_PID > "$DATA_DIR/backend.pid"
echo $FRONTEND_PID > "$DATA_DIR/frontend.pid"
