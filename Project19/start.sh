#!/bin/bash

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
DOCKER_DIR="$PROJECT_ROOT/docker"

PYTHON=$(which python3 || which python)
PIP=$(which pip3 || which pip)

echo "=========================================="
echo "  Smart Home Voice Control System"
echo "  Starting All Services..."
echo "=========================================="
echo ""

check_python() {
    if [ -z "$PYTHON" ]; then
        echo "[ERROR] Python is not installed. Please install Python 3.8+."
        exit 1
    fi
    PYTHON_VERSION=$("$PYTHON" --version 2>&1 | awk '{print $2}')
    echo "[INFO] Python version: $PYTHON_VERSION"
}

install_backend_deps() {
    echo "[INFO] Installing backend dependencies..."
    cd "$BACKEND_DIR"
    if [ -d "venv" ]; then
        echo "[INFO] Virtual environment exists, activating..."
        source venv/bin/activate
    else
        echo "[INFO] Creating virtual environment..."
        "$PYTHON" -m venv venv
        source venv/bin/activate
    fi
    "$PIP" install -q -r requirements.txt
    echo "[INFO] Backend dependencies installed."
}

start_asr_service() {
    echo "[INFO] Starting ASR Service on port 8001..."
    cd "$DOCKER_DIR"
    if [ ! -f "asr_server.py" ]; then
        echo "[WARN] ASR server file not found, using mock in backend."
        return 0
    fi
    if lsof -Pi :8001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "[INFO] ASR Service already running on port 8001"
        return 0
    fi
    nohup "$PYTHON" asr_server.py > "$PROJECT_ROOT/asr_service.log" 2>&1 &
    ASR_PID=$!
    echo "[INFO] ASR Service started (PID: $ASR_PID)"
    sleep 1
}

start_nlu_service() {
    echo "[INFO] Starting NLU Service on port 8002..."
    cd "$DOCKER_DIR"
    if [ ! -f "nlu_server.py" ]; then
        echo "[WARN] NLU server file not found, using mock in backend."
        return 0
    fi
    if lsof -Pi :8002 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "[INFO] NLU Service already running on port 8002"
        return 0
    fi
    nohup "$PYTHON" nlu_server.py > "$PROJECT_ROOT/nlu_service.log" 2>&1 &
    NLU_PID=$!
    echo "[INFO] NLU Service started (PID: $NLU_PID)"
    sleep 1
}

start_backend() {
    echo "[INFO] Starting Flask Backend on port 8080..."
    cd "$BACKEND_DIR"
    source venv/bin/activate

    if lsof -Pi :8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "[WARN] Port 8080 is already in use. Backend may already be running."
        lsof -Pi :8080 -sTCP:LISTEN
        return 0
    fi

    export FLASK_APP=run.py
    export FLASK_ENV=development
    export PYTHONUNBUFFERED=1

    nohup "$PYTHON" run.py > "$PROJECT_ROOT/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo "[INFO] Flask Backend started (PID: $BACKEND_PID)"

    echo "[INFO] Waiting for backend to initialize..."
    sleep 3

    if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        echo "[INFO] Backend health check passed."
    else
        echo "[WARN] Backend health check failed. Check backend.log for details."
    fi
}

show_ports() {
    echo ""
    echo "=========================================="
    echo "  Services Started Successfully!"
    echo "=========================================="
    echo "  Backend API:      http://localhost:8080"
    echo "  ASR Service:      http://localhost:8001"
    echo "  NLU Service:      http://localhost:8002"
    echo ""
    echo "  API Health:       http://localhost:8080/api/health"
    echo "  API Root:         http://localhost:8080/"
    echo ""
    echo "  Log files:"
    echo "    - Backend:  $PROJECT_ROOT/backend.log"
    echo "    - ASR:      $PROJECT_ROOT/asr_service.log"
    echo "    - NLU:      $PROJECT_ROOT/nlu_service.log"
    echo "=========================================="
    echo ""
    echo "To stop all services, run: ./stop.sh"
    echo ""
}

main() {
    check_python
    install_backend_deps
    start_asr_service
    start_nlu_service
    start_backend
    show_ports
}

main
