#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "=== Smart Grid Reactive Power Compensation Control System ==="
echo ""

echo "[1/4] Starting Redis via Docker Compose..."
docker-compose up -d
echo "Waiting for Redis to be ready..."
sleep 3

echo "[2/4] Checking ports..."
for PORT in 8080 9090; do
    if lsof -i:$PORT >/dev/null 2>&1; then
        echo "Port $PORT is in use, attempting to free it..."
        lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
done

echo "[3/4] Building project with Maven..."
if [ ! -d "data" ]; then
    mkdir -p data
fi

if command -v mvn &>/dev/null; then
    mvn clean package -DskipTests -q
elif [ -f "./mvnw" ]; then
    ./mvnw clean package -DskipTests -q
else
    echo "ERROR: Maven not found. Please install Maven or add mvnw wrapper."
    exit 1
fi

echo "[4/4] Starting application..."
java -jar target/reactive-power-control-1.0.0.jar

echo ""
echo "=== System stopped ==="
