#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
SERVER_PID_FILE="$LOG_DIR/server.pid"
CLIENT_PID_FILE="$LOG_DIR/client.pid"

echo "Stopping Collaborative Whiteboard System..."

if [ -f "$SERVER_PID_FILE" ]; then
  SERVER_PID=$(cat "$SERVER_PID_FILE")
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    echo "  Server stopped (PID: $SERVER_PID)"
  fi
  rm -f "$SERVER_PID_FILE"
fi

if [ -f "$CLIENT_PID_FILE" ]; then
  CLIENT_PID=$(cat "$CLIENT_PID_FILE")
  if kill -0 "$CLIENT_PID" 2>/dev/null; then
    kill "$CLIENT_PID" 2>/dev/null || true
    echo "  Client stopped (PID: $CLIENT_PID)"
  fi
  rm -f "$CLIENT_PID_FILE"
fi

echo "All services stopped."
