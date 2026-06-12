#!/bin/bash
set -e

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

echo "Stopping Copyright Blockchain System..."

if command -v docker &> /dev/null; then
    echo "Stopping Meilisearch container..."
    docker compose down 2>/dev/null || true
fi

pkill -f "remix vite:dev" 2>/dev/null || true
pkill -f "node.*vite" 2>/dev/null || true

echo "All services stopped."
