#!/bin/bash

echo "=========================================="
echo "  Stopping All Services..."
echo "=========================================="

echo "[INFO] Stopping services on port 8080 (Backend)..."
PIDS_8080=$(lsof -Pi :8080 -sTCP:LISTEN -t 2>/dev/null || true)
if [ -n "$PIDS_8080" ]; then
    kill -9 $PIDS_8080 2>/dev/null || true
    echo "[INFO] Stopped processes on port 8080"
else
    echo "[INFO] No process running on port 8080"
fi

echo "[INFO] Stopping services on port 8001 (ASR)..."
PIDS_8001=$(lsof -Pi :8001 -sTCP:LISTEN -t 2>/dev/null || true)
if [ -n "$PIDS_8001" ]; then
    kill -9 $PIDS_8001 2>/dev/null || true
    echo "[INFO] Stopped processes on port 8001"
else
    echo "[INFO] No process running on port 8001"
fi

echo "[INFO] Stopping services on port 8002 (NLU)..."
PIDS_8002=$(lsof -Pi :8002 -sTCP:LISTEN -t 2>/dev/null || true)
if [ -n "$PIDS_8002" ]; then
    kill -9 $PIDS_8002 2>/dev/null || true
    echo "[INFO] Stopped processes on port 8002"
else
    echo "[INFO] No process running on port 8002"
fi

echo ""
echo "[INFO] All services stopped."
echo "=========================================="
