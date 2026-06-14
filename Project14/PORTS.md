# Port List

| Service         | Port  | Protocol | Description                  |
|-----------------|-------|----------|------------------------------|
| Backend API     | 9000  | HTTP     | Gin framework REST API       |
| WebSocket       | 9000  | WS       | Real-time data push          |
| Frontend Dev    | 3000  | HTTP     | Vue.js development server    |
| Frontend (Prod) | 80    | HTTP     | Nginx production server      |

## Port Details

### 9000 - Backend Service
- REST API endpoints under `/api/`
- WebSocket endpoint at `/api/ws`
- Used for device data upload and frontend communication

### 3000 - Frontend Development
- Vite development server
- Hot module replacement enabled
- Proxy `/api` requests to backend

### 80 - Frontend Production (Docker)
- Nginx static file server
- Reverse proxy for API requests
- WebSocket proxy support

## Docker Mode Ports

When using Docker Compose:
- Frontend: Port 80 (mapped to host port 80)
- Backend: Port 9000 (mapped to host port 9000)

When using local development:
- Frontend: Port 3000
- Backend: Port 9000
