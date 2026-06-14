#!/bin/bash

echo "Stopping Live Monitor services..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

pkill -f "node src/index.js" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

if command -v docker &> /dev/null && [ -f "$SCRIPT_DIR/docker-compose.yml" ]; then
  cd "$SCRIPT_DIR"
  docker-compose down
fi

echo "All services stopped"
