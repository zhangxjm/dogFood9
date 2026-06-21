#!/bin/bash

set -e

echo "=============================================="
echo "  Smart Recipe System - Startup Script"
echo "=============================================="

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "[ERROR] Docker is not installed. Please install Docker first."
        exit 1
    fi
    if ! command -v docker-compose &> /dev/null; then
        echo "[ERROR] docker-compose is not installed. Please install docker-compose first."
        exit 1
    fi
    echo "[OK] Docker and docker-compose are available"
}

start_backend_native() {
    echo ""
    echo "Starting backend natively..."
    
    cd "$PROJECT_DIR/backend"
    
    if [ ! -d "venv" ]; then
        echo "[INFO] Creating virtual environment..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    
    echo "[INFO] Installing Python dependencies..."
    pip install -r requirements.txt
    
    echo "[INFO] Running database migrations..."
    python manage.py migrate
    
    echo "[INFO] Initializing sample data..."
    python manage.py init_data
    
    echo "[INFO] Starting Django development server on port 8000..."
    python manage.py runserver 0.0.0.0:8000 &
    BACKEND_PID=$!
    
    echo "[OK] Backend started with PID $BACKEND_PID"
    echo ""
}

start_frontend_native() {
    echo "Starting frontend natively..."
    
    cd "$PROJECT_DIR/frontend"
    
    if [ ! -d "node_modules" ]; then
        echo "[INFO] Installing npm dependencies..."
        npm install
    fi
    
    echo "[INFO] Starting React development server on port 3000..."
    BROWSER=none npm start &
    FRONTEND_PID=$!
    
    echo "[OK] Frontend started with PID $FRONTEND_PID"
    echo ""
}

start_with_docker() {
    echo ""
    echo "Starting services with Docker Compose..."
    
    cd "$PROJECT_DIR"
    
    echo "[INFO] Building and starting containers..."
    docker-compose up -d --build
    
    echo "[INFO] Waiting for backend to be ready..."
    sleep 5
    
    echo "[INFO] Running database migrations..."
    docker-compose exec -T backend python manage.py migrate
    
    echo "[INFO] Initializing sample data..."
    docker-compose exec -T backend python manage.py init_data
    
    echo ""
    echo "=============================================="
    echo "  Services started successfully!"
    echo "=============================================="
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:8000"
    echo "  API:      http://localhost:8000/api"
    echo "  Admin:    http://localhost:8000/admin"
    echo "  Admin user: admin / admin123"
    echo "=============================================="
}

start_native() {
    echo ""
    echo "Starting services natively..."
    
    start_backend_native
    sleep 3
    start_frontend_native
    
    echo "=============================================="
    echo "  Services started successfully!"
    echo "=============================================="
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:8000"
    echo "  API:      http://localhost:8000/api"
    echo "  Admin:    http://localhost:8000/admin"
    echo "  Admin user: admin / admin123"
    echo "=============================================="
    echo ""
    echo "Press Ctrl+C to stop all services."
    
    trap "echo '[INFO] Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
    
    wait
}

stop_services() {
    echo ""
    echo "Stopping services..."
    
    if [ -f "$PROJECT_DIR/docker-compose.yml" ]; then
        cd "$PROJECT_DIR"
        if docker-compose ps &> /dev/null; then
            docker-compose down
            echo "[OK] Docker containers stopped"
        fi
    fi
    
    pkill -f "runserver 0.0.0.0:8000" 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    
    echo "[OK] All services stopped"
}

show_help() {
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  docker    Start services using Docker Compose (recommended)"
    echo "  native    Start services natively (requires Python 3.11+ and Node.js 18+)"
    echo "  stop      Stop all running services"
    echo "  help      Show this help message"
    echo ""
    echo "If no option is provided, Docker mode will be used by default."
    echo ""
}

MODE="${1:-docker}"

case $MODE in
    docker)
        check_docker
        start_with_docker
        ;;
    native)
        start_native
        ;;
    stop)
        stop_services
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "[ERROR] Unknown option: $MODE"
        show_help
        exit 1
        ;;
esac
