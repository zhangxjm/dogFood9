# 系统端口列表

## 本机开发模式（默认）

| 端口 | 服务名称 | 服务类型 | 访问地址 | 说明 |
|------|----------|----------|----------|------|
| 5173 | 前端开发服务器 | Vue 3 + Vite | http://localhost:5173 | 前端交互式白板界面，含登录、白板列表、编辑器页面 |
| 3001 | 后端 API 服务 | Express.js + Socket.IO | http://localhost:3001 | REST API 接口 + Socket.IO 实时通信服务 |

## 详细服务说明

### 端口 5173 - 前端开发服务器

**服务类型：** Vite Dev Server (Vue 3)

**功能模块：**
- `/login` - 用户登录页面
- `/register` - 用户注册页面
- `/dashboard` - 白板列表/控制台页面
- `/whiteboard/:id` - 白板编辑器页面（核心功能）

**代理配置：**
- `/api/*` → 代理到 `http://localhost:3001/api/*`
- `/socket.io/*` → 代理到 `http://localhost:3001/socket.io/*`（WebSocket 支持）

**开发工具：**
- HMR（热模块替换）
- 源码映射支持

---

### 端口 3001 - 后端综合服务

**服务类型：** Express.js HTTP + Socket.IO WebSocket

#### REST API 接口列表（/api 前缀）

| 方法 | 路径 | 功能说明 | 权限 |
|------|------|----------|------|
| GET | `/api/health` | 服务健康检查 | 公开 |
| POST | `/api/auth/register` | 用户注册 | 公开 |
| POST | `/api/auth/login` | 用户登录 | 公开 |
| GET | `/api/auth/me` | 获取当前用户信息 | 登录用户 |
| GET | `/api/whiteboards` | 获取当前用户的白板列表 | 登录用户 |
| POST | `/api/whiteboards` | 创建新白板 | 登录用户 |
| GET | `/api/whiteboards/:id` | 获取白板详情（含元素数据） | 读权限 |
| PUT | `/api/whiteboards/:id` | 更新白板信息/保存元素 | 写权限 |
| DELETE | `/api/whiteboards/:id` | 删除白板 | 所有者 |
| GET | `/api/whiteboards/:id/versions` | 获取版本快照列表 | 读权限 |
| POST | `/api/whiteboards/:id/versions` | 创建版本快照 | 写权限 |
| POST | `/api/whiteboards/:id/versions/:vid/restore` | 恢复到指定版本 | 写权限 |
| DELETE | `/api/whiteboards/:id/versions/:vid` | 删除版本快照 | 管理员 |
| GET | `/api/whiteboards/:id/users` | 获取白板用户列表 | 读权限 |
| POST | `/api/whiteboards/:id/users` | 添加用户到白板 | 管理员 |
| PUT | `/api/whiteboards/:id/users/:uid` | 修改用户权限 | 管理员 |
| DELETE | `/api/whiteboards/:id/users/:uid` | 移除用户 | 管理员 |
| GET | `/api/whiteboards/:id/operations` | 查询操作日志（增量同步） | 读权限 |

#### Socket.IO 实时事件

**命名空间：** 默认（`/`），WebSocket 连接：`ws://localhost:3001/socket.io/`

**客户端 → 服务端 事件：**
- `join-whiteboard` - 加入指定白板房间
- `element-add` - 添加元素（协作同步）
- `element-update` - 更新元素（协作同步）
- `element-delete` - 删除元素（协作同步）
- `elements-set` - 全量设置元素（版本恢复/图层操作）
- `cursor-move` - 光标位置移动
- `save-whiteboard` - 保存白板完整状态
- `leave-whiteboard` - 离开白板房间

**服务端 → 客户端 事件：**
- `user-joined` - 有用户加入
- `user-left` - 有用户离开
- `cursor-move` - 用户光标位置更新
- `cursor-remove` - 用户光标移除
- `element-add` - 元素新增广播
- `element-update` - 元素更新广播
- `element-delete` - 元素删除广播
- `elements-set` - 全量元素变更广播
- `whiteboard-saved` - 白板被保存通知

**认证方式：**
- 使用 JWT Token，在 `handshake.auth.token` 中携带 Bearer Token
- 或在 `Authorization` Header 中携带

---

## Docker 生产模式

| 端口 | 服务名称 | 容器名 | 访问地址 | 说明 |
|------|----------|--------|----------|------|
| 8080 | Nginx 前端服务 | whiteboard-client | http://localhost:8080 | 生产构建前端，含反向代理 |
| 3001 | 后端 API 服务 | whiteboard-server | http://localhost:3001 | Express 服务（与开发模式相同） |

**Docker 内部网络：**
- Nginx → 后端服务：`http://server:3001`

**Docker Compose 启动命令：**
```bash
docker-compose up -d
```

---

## 默认测试账号

| 用户名 | 密码 | 权限 |
|--------|------|------|
| admin | admin123 | 系统初始管理员，可创建白板 |

---

## 数据库文件

| 文件路径 | 说明 |
|----------|------|
| `server/whiteboard.db` | SQLite 数据库文件，存储用户、白板、版本、操作日志 |

**自动持久化：** 每 5 秒自动保存内存数据库到磁盘文件。

---

## 防火墙/安全提示

1. **生产部署时**请限制端口 3001 只允许本地/Nginx 访问，不要直接暴露到公网
2. 建议使用 HTTPS 反向代理（Nginx/Apache）
3. JWT Token 建议设置较短过期时间（默认 7 天）
4. 定期备份 `server/whiteboard.db` 数据库文件
