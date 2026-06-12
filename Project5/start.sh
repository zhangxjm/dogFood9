#!/bin/bash

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$BASE_DIR"

echo "========================================"
echo "  FraudGuard Anti-Fraud System"
echo "  Startup Script"
echo "========================================"
echo ""

DATA_DIR="$BASE_DIR/data"
if [ ! -d "$DATA_DIR" ]; then
    mkdir -p "$DATA_DIR"
    echo "Created data directory: $DATA_DIR"
fi

echo "Checking Java environment..."
if ! command -v java &> /dev/null; then
    echo "ERROR: Java is not installed. Please install Java 17 or higher."
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -n 1 | awk -F '"' '{print $2}' | cut -d'.' -f1)
echo "Java version: $(java -version 2>&1 | head -n 1)"

if [ "$JAVA_VERSION" -lt 17 ]; then
    echo "ERROR: Java 17 or higher is required. Current version: $JAVA_VERSION"
    exit 1
fi

echo ""
echo "Checking Maven..."
if ! command -v mvn &> /dev/null; then
    echo "ERROR: Maven is not installed. Please install Maven 3.6 or higher."
    exit 1
fi
echo "Maven version: $(mvn -version | head -n 1 | awk '{print $3}')"

echo ""
echo "Building project..."
mvn clean package -DskipTests -q
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed."
    exit 1
fi
echo "Build completed successfully."

JAR_FILE=$(ls target/*.jar 2>/dev/null | head -n 1)
if [ -z "$JAR_FILE" ]; then
    echo "ERROR: JAR file not found."
    exit 1
fi

echo ""
echo "========================================"
echo "  Starting FraudGuard System..."
echo "========================================"
echo ""
echo "Application URL: http://localhost:8080"
echo "Health Check:    http://localhost:8080/actuator/health"
echo "API Docs:        http://localhost:8080/api"
echo ""
echo "Press Ctrl+C to stop the server."
echo ""

JAVA_OPTS="-Xms512m -Xmx1024m -XX:+UseG1GC -Dfile.encoding=UTF-8"

exec java $JAVA_OPTS -jar "$JAR_FILE"
