# System Port List

| Service | Port | Protocol | Description |
|---------|------|----------|-------------|
| Frontend Web | 5173 | HTTP | Vue.js monitoring platform web interface |
| Backend API | 8080 | HTTP | Gin framework REST API service |
| Backend WebSocket | 8080 | WS | Real-time device data push endpoint (/ws) |
| Docker Frontend (optional) | 80 | HTTP | Nginx hosted frontend (Docker deployment) |

## Access URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- WebSocket: ws://localhost:8080/ws
- Health Check: http://localhost:8080/health

## Docker Deployment Ports

When using Docker Compose:

- Frontend: http://localhost:80
- Backend API: http://localhost:8080
