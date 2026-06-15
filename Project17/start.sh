#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "=========================================="
echo "Fraud Detection System - Start Script"
echo "=========================================="

echo ""
echo "[1/5] Checking environment..."

if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 is not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not installed"
    exit 1
fi

echo "Python version: $(python3 --version)"
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

echo ""
echo "[2/5] Setting up backend..."

cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing Python dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo "Training ML model..."
python3 -m app.ml_model

echo "Initializing database..."
python3 -m app.init_db

echo ""
echo "[3/5] Setting up frontend..."

cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

echo ""
echo "[4/5] Starting backend service..."
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"

cd "$BACKEND_DIR"
source venv/bin/activate

if command -v lsof &> /dev/null; then
    if lsof -ti:8000 &> /dev/null; then
        echo "Port 8000 is already in use, killing process..."
        kill -9 $(lsof -ti:8000) 2>/dev/null || true
    fi
fi

nohup python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > "$SCRIPT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

sleep 3

echo ""
echo "[5/5] Starting frontend service..."
echo "Frontend: http://localhost:5173"

cd "$FRONTEND_DIR"

if command -v lsof &> /dev/null; then
    if lsof -ti:5173 &> /dev/null; then
        echo "Port 5173 is already in use, killing process..."
        kill -9 $(lsof -ti:5173) 2>/dev/null || true
    fi
fi

nohup npm run dev > "$SCRIPT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "=========================================="
echo "System starting..."
echo "=========================================="
echo ""
echo "Backend API:  http://localhost:8000"
echo "API Docs:     http://localhost:8000/docs"
echo "Frontend:     http://localhost:5173"
echo ""
echo "Backend log:  $SCRIPT_DIR/backend.log"
echo "Frontend log: $SCRIPT_DIR/frontend.log"
echo ""
echo "To stop services, run: ./stop.sh"
echo ""

echo "Waiting for services to start..."
sleep 5

echo ""
echo "Services are ready!"
echo "Open http://localhost:5173 in your browser"
