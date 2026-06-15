# Port Usage Documentation

## System Ports

| Port | Service | Protocol | Description | Bind Address | Access |
|------|---------|----------|-------------|--------------|--------|
| 3000 | Frontend Web (Vite) | HTTP | React-based Student/Teacher Web UI, includes dev server & production preview | 0.0.0.0 (all interfaces) | Public (Browser) |
| 8080 | Backend API (Spring Boot) | HTTP | REST API endpoints under context path `/api` | 0.0.0.0 (all interfaces) | Internal + Proxied |
| 6379 | Redis Cache | TCP | Caching, session storage, rate limiting | 127.0.0.1 (localhost only via docker) | Internal only |
| 5005 | Java Debug (JDWP) | TCP | JVM Debug Port (dev.sh only) | localhost | Internal (Dev only) |

---

## Detailed Port Description

### 3000 - Frontend Web Server
- **Component**: Vite (React 18 + TypeScript)
- **URL**: `http://<server-ip>:3000`
- **Entry Points**:
  - `/login` - Login page
  - `/register` - Registration page
  - `/teacher/*` - Teacher dashboard and management pages
  - `/student/*` - Student learning and exam pages
- **Proxy**: API requests with prefix `/api` are proxied to backend port 8080
- **Serves**: Built static assets (production) or HMR dev server

### 8080 - Backend REST API
- **Component**: Spring Boot 3.2.x (embedded Tomcat)
- **Context Path**: `/api`
- **API Groups**:
  - `/api/auth/**` - Authentication (login, register, current user)
  - `/api/questions/**` - Question bank CRUD
  - `/api/papers/**` - Paper management and auto-generator
  - `/api/exams/**` - Exam lifecycle management and submission
  - `/api/knowledge/**` - Knowledge point tree management
  - `/api/users/**` - User management (student list, subjects)
  - `/api/wrong-book/**` - Student wrong-question book
  - `/api/study/**` - Learning dashboard, knowledge analysis, personalized recommendation
- **Authentication**: Bearer JWT token in `Authorization` header (except `/api/auth/**`)

### 6379 - Redis
- **Component**: Redis 7.2 (Docker container `exam-redis`)
- **Usage**:
  - User session cache (optional future extension)
  - Rate limit counters
  - Hot data cache for frequently accessed questions and papers
- **Persistence**: AOF enabled (`appendonly yes`)
- **Volume**: Docker named volume `redis-data` for persistence

### 5005 - JVM Debug
- **Component**: Spring Boot JVM (Java Debug Wire Protocol)
- **Availability**: Only when started via `./dev.sh` (development mode)
- **Purpose**: Remote debugging from IDE (IntelliJ IDEA / Eclipse)
- **Not exposed in production builds**

---

## Docker Container Ports

| Container Name | Internal Port | Host Port | Purpose |
|---------------|---------------|-----------|---------|
| exam-redis | 6379 | 6379 | Redis service |

---

## Firewall / Security Notes

1. **Recommended to expose only port 3000** to public network. Backend API is accessed via Vite proxy on same origin.
2. Port 6379 (Redis) should **never** be exposed to public internet. Restrict to 127.0.0.1 or trusted networks.
3. Port 5005 (JDWP debug) should **never** be enabled in production; `start.sh` does not activate it.
4. All API endpoints (except `/api/auth/login` and `/api/auth/register`) require valid JWT tokens.

---

## Verify Port Availability (Pre-start Check)

Before starting the system, verify these ports are not in use:

```bash
lsof -i :3000 -i :8080 -i :6379 -i :5005
# Or for Linux:
netstat -tlnp | grep -E ':(3000|8080|6379|5005) '
```

If a port conflict occurs:
- **3000**: Modify `frontend/vite.config.ts` -> `server.port` and `--port` arg in `start.sh`
- **8080**: Modify `backend/src/main/resources/application.yml` -> `server.port` + update proxy in vite config
- **6379**: Modify `docker-compose.yml` ports mapping + `application.yml` spring.data.redis.port
