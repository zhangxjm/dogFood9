#!/bin/bash

set -e

echo "============================================"
echo "Starting Frontend Service..."
echo "============================================"

cd "$(dirname "$0")/../frontend"

if ! command -v node &> /dev/null; then
    echo "Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Starting frontend dev server on port 3000..."
npm run dev
