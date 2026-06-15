# 系统端口列表

## 后端服务端口

| 端口 | 协议 | 服务 | 说明 |
|------|------|------|------|
| 3000 | TCP | NestJS HTTP API | RESTful API 服务端口 |
| 3000 | TCP | Socket.IO WebSocket | 实时设备控制和状态推送 |

## 前端开发端口

| 端口 | 协议 | 服务 | 说明 |
|------|------|------|------|
| 8081 | TCP | Expo Dev Server | React Native Web 开发服务器 |
| 19000 | UDP | Expo Metro Bundler | Metro 打包服务（可选） |
| 19001 | TCP | Expo Metro Bundler | Metro 打包服务（可选） |
| 19002 | TCP | Expo Dev Tools | Expo 开发者工具（可选） |

## Docker 端口映射

| 主机端口 | 容器端口 | 服务 |
|----------|----------|------|
| 3000 | 3000 | Backend API + WebSocket |

## 端口占用检查

### macOS / Linux
```bash
# 检查端口是否被占用
lsof -i :3000
lsof -i :8081

# 杀死占用端口的进程
kill -9 <PID>
```

### Windows (PowerShell)
```powershell
# 检查端口是否被占用
netstat -ano | findstr :3000

# 杀死占用端口的进程
taskkill /PID <PID> /F
```

## 防火墙配置

如果系统启用了防火墙，请确保以下端口已开放：

### 后端服务
- 入站规则：允许 TCP 3000 端口
- 出站规则：允许所有

### 前端开发（仅开发环境）
- 入站规则：允许 TCP 8081 端口
- 出站规则：允许所有

## 修改端口配置

### 后端端口修改
编辑 `backend/.env` 文件：
```env
PORT=3000
WS_PORT=3000
```

### 前端端口修改
编辑 `frontend/app.json` 的 `extra` 字段：
```json
"extra": {
  "apiBaseUrl": "http://localhost:3000/api",
  "wsUrl": "ws://localhost:3000"
}
```

### Docker 端口修改
编辑 `docker-compose.yml` 文件：
```yaml
ports:
  - "3000:3000"
```

## 外部服务依赖

本系统使用 SQLite 本地数据库，无需额外的数据库端口。所有数据存储在 `backend/data/` 目录下。
