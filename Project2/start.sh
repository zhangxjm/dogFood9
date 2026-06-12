#!/bin/bash
set -e

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

echo "============================================"
echo "  Copyright Blockchain System - Startup"
echo "============================================"
echo ""

echo "[1/6] Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is required but not installed."
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is required but not installed."
    exit 1
fi
if ! command -v docker &> /dev/null; then
    echo "WARNING: Docker not found. Meilisearch will be skipped (search features disabled)."
    DOCKER_AVAILABLE=false
else
    DOCKER_AVAILABLE=true
fi
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - Docker: $($DOCKER_AVAILABLE && echo "$(docker --version | cut -d' ' -f3 | tr -d ',')" || echo "N/A")"
echo ""

echo "[2/6] Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "  Installing npm dependencies..."
    npm install
else
    echo "  Dependencies already installed."
fi
echo ""

if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "[3/6] Starting Meilisearch via Docker..."
    if docker compose ps meilisearch --format json 2>/dev/null | grep -q "Running"; then
        echo "  Meilisearch is already running."
    else
        docker compose up -d meilisearch
        echo "  Waiting for Meilisearch to be ready..."
        sleep 3
    fi
    echo "  Meilisearch: http://127.0.0.1:7700"
else
    echo "[3/6] Docker not available, skipping Meilisearch."
fi
echo ""

echo "[4/6] Setting up database..."
if [ ! -f "prisma/dev.db" ]; then
    echo "  Generating Prisma client..."
    npx prisma generate
    echo "  Running database migrations..."
    npx prisma migrate dev --name init
    echo "  Seeding initial data..."
    npx tsx prisma/seed.ts
else
    echo "  Database already exists."
    if [ ! -d "node_modules/.prisma" ]; then
        npx prisma generate
    fi
fi
echo ""

echo "[5/6] Verifying environment..."
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
DATABASE_URL="file:./dev.db"
MEILISEARCH_HOST="http://127.0.0.1:7700"
MEILISEARCH_MASTER_KEY="copyright-master-key-2024"
MEILISEARCH_INDEX="copyright_works"
SESSION_SECRET="copyright-system-session-secret-key-2024"
EOF
    echo "  .env file created."
fi
echo ""

echo "[6/6] Starting application..."
echo ""
echo "============================================"
echo "  System is starting up..."
echo ""
echo "  Application URL:  http://localhost:3000"
echo "  Meilisearch:      http://localhost:7700"
echo ""
echo "  Ports Used:"
echo "    - 3000: Remix Web Application"
echo "    - 7700: Meilisearch Search Engine"
echo ""
echo "  Press Ctrl+C to stop the server."
echo "============================================"
echo ""

npm run dev
