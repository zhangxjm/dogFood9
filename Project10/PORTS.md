# Port List

## System Ports

| Port | Service | Description | Access URL |
|------|---------|-------------|------------|
| 8080 | Frontend (Vue.js) | Web User Interface | http://localhost:8080 |
| 5001 | Backend API (Flask) | REST API Service | http://localhost:5001 |
| 9200 | Elasticsearch HTTP | Elasticsearch REST API | http://localhost:9200 |
| 9300 | Elasticsearch TCP | Elasticsearch Transport (internal) | - |

## Docker Mode Ports

When running with Docker, the same ports are exposed on the host machine:

- **8080**: Frontend (Nginx)
- **5000**: Backend API (Gunicorn) - internal Docker port
- **5001**: Backend API - host mapped port
- **9200**: Elasticsearch HTTP API
- **9300**: Elasticsearch TCP transport (for cluster communication)

## Internal Docker Network Ports

These ports are only accessible within the Docker network:

- **backend:5000**: Backend service (internal DNS)
- **elasticsearch:9200**: Elasticsearch service (internal DNS)

## Notes

1. The frontend communicates with the backend via `/api` proxy
2. Elasticsearch is optional; if not available, the system falls back to SQLite-based search
3. All services can run on a single machine
4. Make sure no other services are using these ports before starting the system
5. Port 5001 is used on host to avoid conflicts with macOS AirPlay Receiver (port 5000)
