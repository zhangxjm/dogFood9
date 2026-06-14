#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "========================================="
echo "  Mine Digital Twin Safety System"
echo "  Startup Script"
echo "========================================="

command -v python3 >/dev/null 2>&1 || { echo "ERROR: python3 not found"; exit 1; }

if [ ! -d "venv" ]; then
    echo "[1/5] Creating virtual environment..."
    python3 -m venv venv
else
    echo "[1/5] Virtual environment already exists, skipping..."
fi

echo "[2/5] Installing dependencies..."
source venv/bin/activate
pip install -r requirements.txt -q 2>/dev/null

echo "[3/5] Starting Flink cluster (Docker)..."
if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
        docker compose up -d 2>/dev/null || echo "  Flink cluster startup skipped (Docker Compose may not be available)"
        echo "  Waiting for Flink JobManager..."
        for i in $(seq 1 15); do
            if curl -sf http://localhost:8081/config >/dev/null 2>&1; then
                echo "  Flink JobManager is ready!"
                break
            fi
            sleep 2
        done
    else
        echo "  Docker daemon not running, skipping Flink cluster"
    fi
else
    echo "  Docker not found, skipping Flink cluster"
fi

echo "[4/5] Initializing database..."
cd backend
python3 -c "from database import init_db; init_db()" 2>/dev/null || true
python3 init_data.py 2>/dev/null || echo "  Data may already be initialized"
cd ..

echo "[5/5] Starting FastAPI server..."
cd backend
source "$PROJECT_DIR/venv/bin/activate"
echo ""
echo "========================================="
echo "  System is starting!"
echo "========================================="
echo "  Web UI:     http://localhost:8000"
echo "  API Docs:   http://localhost:8000/docs"
echo "  Flink UI:   http://localhost:8081"
echo "========================================="
echo ""

python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
