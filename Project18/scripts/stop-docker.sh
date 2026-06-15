#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR/.."

echo "Stopping services..."

if command -v docker compose &> /dev/null; then
    docker compose down
else
    docker-compose down
fi

echo "Services stopped successfully."
