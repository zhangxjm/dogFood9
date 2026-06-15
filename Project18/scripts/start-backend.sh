#!/bin/bash

set -e

echo "============================================"
echo "Starting Backend Service..."
echo "============================================"

cd "$(dirname "$0")/../backend"

echo "Checking Go installation..."
if ! command -v go &> /dev/null; then
    echo "Go not found. Please install Go 1.21+ first."
    exit 1
fi

echo "Downloading dependencies..."
go mod download

echo "Creating data directory..."
mkdir -p ./data

echo "Starting backend server on port 8080..."
go run main.go
