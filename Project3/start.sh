#!/bin/bash

# ============================================
# Agricultural Digital Twin System - Startup Script
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================"
echo "  Agricultural Digital Twin System"
echo "  Smart Precision Planting Platform"
echo "============================================"
echo ""

echo "[1/6] Checking Python environment..."
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python3 not found. Please install Python 3.9+ first."
    exit 1
fi
echo "Python version: $(python3 --version)"
echo ""

echo "[2/6] Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created."
else
    echo "Virtual environment already exists."
fi

source venv/bin/activate
echo ""

echo "[3/6] Installing Python dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "Dependencies installed successfully."
echo ""

echo "[4/6] Starting Docker services (Kafka + Zookeeper + Kafka UI)..."
if command -v docker &> /dev/null; then
    if docker ps -a --format '{{.Names}}' | grep -q 'agri-kafka'; then
        echo "Docker containers already exist, starting..."
        docker-compose start
    else
        echo "Starting new Docker containers..."
        docker-compose up -d
    fi
    echo "Docker services starting..."
    echo "Waiting for Kafka to be ready..."
    sleep 15
else
    echo "WARNING: Docker not found. Kafka will run in simulated mode."
fi
echo ""

echo "[5/6] Initializing database and sample data..."
export PYTHONPATH="$SCRIPT_DIR"
python3 -c "from src.database.init_data import init_sample_data; init_sample_data()"
echo "Database initialized."
echo ""

echo "[6/6] Training ML models..."
python3 -c "from src.models import train_all_models; train_all_models()"
echo "Models trained."
echo ""

echo "============================================"
echo "  Starting Streamlit web application..."
echo "============================================"
echo ""
echo "The application will be available at:"
echo "  - Streamlit UI:  http://localhost:8501"
echo "  - Kafka UI:      http://localhost:8080 (if Docker is running)"
echo ""
echo "Press Ctrl+C to stop the application."
echo ""

echo "" | streamlit run app.py --server.port=8501 --server.address=0.0.0.0
