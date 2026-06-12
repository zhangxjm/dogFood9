#!/bin/bash

# ============================================
# Agricultural Digital Twin System - Stop Script
# ============================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Stopping Agricultural Digital Twin System..."

echo "Stopping Streamlit..."
pkill -f "streamlit run app.py" || true

echo "Stopping data simulator..."
pkill -f "data_simulator.py" || true

if command -v docker &> /dev/null; then
    echo "Stopping Docker services..."
    docker-compose stop
fi

echo "All services stopped."
