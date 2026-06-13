#!/bin/bash

# ============================================
# Agricultural Digital Twin System - Startup Script
# ============================================

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

echo "[4/6] Starting Docker services (Kafka + Kafka UI)..."
DOCKER_SUCCESS=false

if command -v docker &> /dev/null; then
    if docker ps -a --format '{{.Names}}' | grep -q 'agri-'; then
        echo "Cleaning up old containers..."
        docker-compose down -v 2>/dev/null || true
        docker rm -f agri-kafka agri-kafka-ui 2>/dev/null || true
    fi
    
    echo "Starting new Docker containers..."
    if docker-compose up -d 2>&1; then
        echo "Docker services starting..."
        echo "Waiting for Kafka to be ready..."
        sleep 15
        
        if docker ps --format '{{.Names}}' | grep -q 'agri-kafka'; then
            DOCKER_SUCCESS=true
            echo "Kafka is running successfully."
        else
            echo "WARNING: Kafka container failed to start."
        fi
    else
        echo "WARNING: Docker image pull or startup failed."
    fi
else
    echo "WARNING: Docker not found. Kafka will run in simulated mode."
fi

if [ "$DOCKER_SUCCESS" = false ]; then
    echo ""
    echo "--------------------------------------------------"
    echo "  NOTICE: Kafka services not available."
    echo "  The system will run in standalone mode."
    echo "  All core features are still functional."
    echo "  Install Docker to enable real-time streaming."
    echo "--------------------------------------------------"
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
if [ "$DOCKER_SUCCESS" = true ]; then
    echo "  - Kafka UI:      http://localhost:8080"
fi
echo ""
echo "Press Ctrl+C to stop the application."
echo ""

echo "" | streamlit run app.py --server.port=8501 --server.address=0.0.0.0
