============================================
Port List - Delivery Route Optimization System
============================================

Service          Port    Description
--------------------------------------------
Frontend         3000    React Management Dashboard (Vite Dev Server)
Backend API      8080    Gin Backend Server (REST API)

============================================
Access URLs:
- Frontend Admin:    http://localhost:3000
- Backend API:       http://localhost:8080/api
- Health Check:      http://localhost:8080/health
============================================

Note: Both ports must be available on the host system.
If you need to change ports, modify the following files:
- Frontend port: frontend/vite.config.js, frontend/Dockerfile, docker-compose.yml
- Backend port:  backend/main.go, backend/Dockerfile, docker-compose.yml, frontend/vite.config.js (proxy)
