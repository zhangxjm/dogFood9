#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "========================================="
echo "  Lung CT Nodule Detection System"
echo "  Startup Script"
echo "========================================="
echo ""

check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    fi
    return 0
}

echo "[1/6] Starting Docker middleware (Redis, RabbitMQ)..."
DOCKER_STARTED=false
if command -v docker &>/dev/null; then
    if docker info &>/dev/null 2>&1; then
        cd "$PROJECT_DIR"
        if docker compose version &>/dev/null 2>&1; then
            docker compose up -d 2>/dev/null && DOCKER_STARTED=true || echo "[WARN] Docker compose failed"
        elif docker-compose version &>/dev/null 2>&1; then
            docker-compose up -d 2>/dev/null && DOCKER_STARTED=true || echo "[WARN] Docker compose failed"
        fi
        if [ "$DOCKER_STARTED" = true ]; then
            echo "  - Redis:       localhost:6379"
            echo "  - RabbitMQ:    localhost:5672"
            echo "  - RabbitMQ UI: http://localhost:15672 (admin/admin123)"
        fi
    else
        echo "[WARN] Docker daemon not running, skipping middleware"
    fi
else
    echo "[WARN] Docker not installed, skipping middleware"
fi
echo ""

echo "[2/6] Setting up Python backend..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    echo "  Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "  Installing Python dependencies..."
pip install -q -r requirements.txt 2>/dev/null || pip install -r requirements.txt

echo "  Installing TensorFlow (optional)..."
TF_INSTALLED=false
PY_VER=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>/dev/null || echo "3.11")
ARCH=$(uname -m)

if [ "$ARCH" = "arm64" ]; then
    echo "    Detected Apple Silicon (arm64), trying tensorflow-macos..."
    pip install -q "tensorflow-macos>=2.13,<2.16" 2>/dev/null && TF_INSTALLED=true || \
    pip install -q "tensorflow>=2.13,<2.16" 2>/dev/null && TF_INSTALLED=true || \
    echo "    [WARN] TensorFlow install failed, using demo mode (AI detection will use simulated data)"
else
    echo "    Detected Intel Mac (x86_64), trying tensorflow..."
    pip install -q "tensorflow>=2.13,<2.16" 2>/dev/null && TF_INSTALLED=true || \
    echo "    [WARN] TensorFlow install failed, using demo mode (AI detection will use simulated data)"
fi

if [ "$TF_INSTALLED" = true ]; then
    echo "    TensorFlow installed successfully"
fi

echo "  Running database migrations..."
python manage.py migrate --noinput

echo "  Initializing sample data..."
python init_data.py 2>/dev/null || echo "  [INFO] Sample data may already exist"

echo "  Collecting static files..."
python manage.py collectstatic --noinput 2>/dev/null || true
echo ""

echo "[3/6] Preparing Angular frontend..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    echo "  Installing npm dependencies..."
    npm install --legacy-peer-deps
fi

if [ ! -d "dist" ]; then
    echo "  Building Angular application..."
    npx ng build --configuration production 2>/dev/null || npx ng build
fi
echo ""

echo "[4/6] Starting Django backend server..."
cd "$BACKEND_DIR"
source venv/bin/activate

if ! check_port 8000; then
    echo "[WARN] Port 8000 is already in use"
else
    python manage.py runserver 0.0.0.0:8000 > /tmp/django_server.log 2>&1 &
    BACKEND_PID=$!
    echo "  Backend PID: $BACKEND_PID"
    echo "  Backend URL: http://localhost:8000"
fi
echo ""

echo "[5/6] Starting Celery worker (background)..."
if [ "$DOCKER_STARTED" = true ]; then
    cd "$BACKEND_DIR"
    source venv/bin/activate
    celery -A config worker -l info --concurrency=1 > /tmp/celery_worker.log 2>&1 &
    CELERY_PID=$!
    echo "  Celery PID: $CELERY_PID"
else
    echo "[WARN] Skipping Celery (Redis not available)"
    CELERY_PID=""
fi
echo ""

echo "[6/6] Starting Angular dev server..."
cd "$FRONTEND_DIR"

if ! check_port 4200; then
    echo "[WARN] Port 4200 is already in use"
else
    npx ng serve --host 0.0.0.0 --port 4200 --proxy-config proxy.conf.json > /tmp/angular_server.log 2>&1 &
    FRONTEND_PID=$!
    echo "  Frontend PID: $FRONTEND_PID"
    echo "  Frontend URL: http://localhost:4200"

    echo "  Waiting for frontend to start..."
    for i in $(seq 1 60); do
        if lsof -Pi :4200 -sTCP:LISTEN -t >/dev/null 2>&1; then
            break
        fi
        sleep 1
    done
fi
echo ""

echo "========================================="
echo "  System Started Successfully!"
echo "========================================="
echo ""
echo "  Frontend:  http://localhost:4200"
echo "  Backend:   http://localhost:8000"
echo "  Admin:     http://localhost:8000/admin/"
echo ""
echo "  Default Login Credentials:"
echo "    Username: admin"
echo "    Password: admin123"
echo ""
echo "  Port Usage:"
echo "    4200  - Frontend (Angular Dev Server)"
echo "    8000  - Backend (Django)"
echo "    6379  - Redis"
echo "    5672  - RabbitMQ"
echo "    15672 - RabbitMQ Management UI"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "========================================="

cleanup() {
    echo ""
    echo "Stopping services..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ -n "$CELERY_PID" ]; then
        kill $CELERY_PID 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    if [ "$DOCKER_STARTED" = true ]; then
        cd "$PROJECT_DIR"
        docker compose down 2>/dev/null || docker-compose down 2>/dev/null || true
    fi
    echo "All services stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

wait
