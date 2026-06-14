# Port List

This document lists all ports used by the Live Monitor system.

## Ports

| Service          | Port  | Protocol | Description                              | Access URL                  |
|------------------|-------|----------|------------------------------------------|-----------------------------|
| Frontend (Next.js) | 3000  | HTTP     | Data visualization dashboard            | http://localhost:3000      |
| Backend (Express) | 3001  | HTTP     | REST API and WebSocket server            | http://localhost:3001      |
| WebSocket        | 3001  | WS       | Real-time data push service              | ws://localhost:3001/ws     |
| Redis            | 6379  | TCP      | Hot data cache                           | localhost:6379              |

## Service Details

### Frontend (Port 3000)
- Framework: Next.js 14
- Type: Development server (dev mode)
- Pages:
  - / - Real-time monitoring dashboard
  - /room/[id] - Live room detail page
  - /compare - Multi-dimensional data comparison
  - /report - Custom report generation
  - /products - Product analysis

### Backend (Port 3001)
- Framework: Express.js 4
- API prefix: /api
- Key endpoints:
  - GET /api/platforms - Get all platforms
  - GET /api/rooms - Get all live rooms
  - GET /api/metrics/latest - Get latest real-time metrics
  - GET /api/metrics/room/:id - Get room metrics history
  - GET /api/products/top - Get top products
  - GET /health - Health check
- WebSocket endpoint: /ws

### Redis (Port 6379)
- Version: Redis 7 (Alpine)
- Storage: Hot data cache
- Persistence: AOF enabled
- Key patterns:
  - platforms - Platform list cache
  - rooms:all - All rooms cache
  - metrics:latest - Latest metrics cache
  - latest_metrics - WebSocket broadcast cache

## Database
- Type: SQLite
- File: server/data/live_monitor.db
- No port required (file-based)

## Docker
- Redis runs in Docker container
- Container name: live-monitor-redis
- Docker Compose file: docker-compose.yml
