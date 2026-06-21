const { Server } = require('socket.io');
const { verifyToken } = require('../middleware');
const { User, Whiteboard, WhiteboardUser, Operation } = require('../models');

const whiteboardRooms = new Map();

function getRoom(whiteboardId) {
  if (!whiteboardRooms.has(whiteboardId)) {
    whiteboardRooms.set(whiteboardId, {
      users: new Map(),
      lastSeq: 0
    });
  }
  return whiteboardRooms.get(whiteboardId);
}

function getUserList(room) {
  const users = [];
  room.users.forEach((userData) => {
    users.push({
      id: userData.id,
      username: userData.username,
      socketId: userData.socketId,
      cursor: userData.cursor,
      joinedAt: userData.joinedAt
    });
  });
  return users;
}

function setupSocketIO(server) {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers?.authorization;
    if (!token) {
      return next(new Error('未提供认证令牌'));
    }

    const tokenStr = token.startsWith('Bearer ') ? token.substring(7) : token;
    const decoded = verifyToken(tokenStr);

    if (!decoded) {
      return next(new Error('认证令牌无效或已过期'));
    }

    socket.userId = decoded.id;
    socket.username = decoded.username;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] 用户连接: ${socket.username} (${socket.id})`);

    socket.on('join-whiteboard', async ({ whiteboardId }, callback) => {
      try {
        if (!whiteboardId) {
          if (callback) callback({ success: false, message: '白板ID不能为空' });
          return;
        }

        const whiteboard = Whiteboard.findById(whiteboardId);
        if (!whiteboard) {
          if (callback) callback({ success: false, message: '白板不存在' });
          return;
        }

        const hasPermission = WhiteboardUser.hasPermission(whiteboardId, socket.userId, 'read');
        if (!hasPermission) {
          if (callback) callback({ success: false, message: '权限不足' });
          return;
        }

        const user = User.findById(socket.userId);
        if (!user) {
          if (callback) callback({ success: false, message: '用户不存在' });
          return;
        }

        if (socket.currentWhiteboard) {
          leaveWhiteboard(socket, io);
        }

        socket.join(whiteboardId);
        socket.currentWhiteboard = whiteboardId;

        const room = getRoom(whiteboardId);
        room.users.set(socket.userId, {
          id: socket.userId,
          username: user.username,
          socketId: socket.id,
          cursor: null,
          joinedAt: new Date().toISOString()
        });

        const maxSeq = Operation.getMaxSeq(whiteboardId);
        room.lastSeq = maxSeq;

        const userList = getUserList(room);
        const elements = whiteboard.current_data?.elements || [];

        if (callback) {
          callback({
            success: true,
            message: '加入成功',
            whiteboard: {
              id: whiteboard.id,
              name: whiteboard.name,
              elements,
              version: whiteboard.version,
              ownerId: whiteboard.owner_id,
              ownerName: whiteboard.owner_name,
              createdAt: whiteboard.created_at,
              updatedAt: whiteboard.updated_at
            },
            users: userList,
            maxSeq
          });
        }

        io.to(whiteboardId).emit('user-joined', {
          user: {
            id: socket.userId,
            username: user.username,
            socketId: socket.id
          },
          users: userList
        });

        console.log(`[Socket.IO] ${socket.username} 加入白板 ${whiteboardId}`);
      } catch (err) {
        console.error('[Socket.IO] join-whiteboard 错误:', err);
        if (callback) callback({ success: false, message: '加入失败: ' + err.message });
      }
    });

    socket.on('element-add', async ({ whiteboardId, element }, callback) => {
      try {
        if (socket.currentWhiteboard !== whiteboardId) {
          if (callback) callback({ success: false, message: '未加入该白板' });
          return;
        }

        const hasPermission = WhiteboardUser.hasPermission(whiteboardId, socket.userId, 'write');
        if (!hasPermission) {
          if (callback) callback({ success: false, message: '没有写权限' });
          return;
        }

        const room = getRoom(whiteboardId);
        const newSeq = room.lastSeq + 1;
        room.lastSeq = newSeq;

        const timestamp = new Date().toISOString();
        const opData = { element };
        Operation.create(
          whiteboardId,
          socket.userId,
          'element-add',
          opData,
          timestamp,
          newSeq
        );

        socket.to(whiteboardId).emit('element-add', {
          ...element,
          userId: socket.userId,
          username: socket.username
        });

        if (callback) {
          callback({
            success: true,
            opSeq: newSeq,
            timestamp
          });
        }
      } catch (err) {
        console.error('[Socket.IO] element-add 错误:', err);
        if (callback) callback({ success: false, message: '操作失败: ' + err.message });
      }
    });

    socket.on('element-update', async ({ whiteboardId, id, updates }, callback) => {
      try {
        if (socket.currentWhiteboard !== whiteboardId) {
          if (callback) callback({ success: false, message: '未加入该白板' });
          return;
        }

        const hasPermission = WhiteboardUser.hasPermission(whiteboardId, socket.userId, 'write');
        if (!hasPermission) {
          if (callback) callback({ success: false, message: '没有写权限' });
          return;
        }

        const room = getRoom(whiteboardId);
        const newSeq = room.lastSeq + 1;
        room.lastSeq = newSeq;

        const timestamp = new Date().toISOString();
        const opData = { id, updates };
        Operation.create(
          whiteboardId,
          socket.userId,
          'element-update',
          opData,
          timestamp,
          newSeq
        );

        socket.to(whiteboardId).emit('element-update', {
          id,
          updates,
          userId: socket.userId,
          username: socket.username
        });

        if (callback) {
          callback({
            success: true,
            opSeq: newSeq,
            timestamp
          });
        }
      } catch (err) {
        console.error('[Socket.IO] element-update 错误:', err);
        if (callback) callback({ success: false, message: '操作失败: ' + err.message });
      }
    });

    socket.on('element-delete', async ({ whiteboardId, id }, callback) => {
      try {
        if (socket.currentWhiteboard !== whiteboardId) {
          if (callback) callback({ success: false, message: '未加入该白板' });
          return;
        }

        const hasPermission = WhiteboardUser.hasPermission(whiteboardId, socket.userId, 'write');
        if (!hasPermission) {
          if (callback) callback({ success: false, message: '没有写权限' });
          return;
        }

        const room = getRoom(whiteboardId);
        const newSeq = room.lastSeq + 1;
        room.lastSeq = newSeq;

        const timestamp = new Date().toISOString();
        const opData = { id };
        Operation.create(
          whiteboardId,
          socket.userId,
          'element-delete',
          opData,
          timestamp,
          newSeq
        );

        socket.to(whiteboardId).emit('element-delete', {
          id,
          userId: socket.userId,
          username: socket.username
        });

        if (callback) {
          callback({
            success: true,
            opSeq: newSeq,
            timestamp
          });
        }
      } catch (err) {
        console.error('[Socket.IO] element-delete 错误:', err);
        if (callback) callback({ success: false, message: '操作失败: ' + err.message });
      }
    });

    socket.on('elements-set', async ({ whiteboardId, elements }, callback) => {
      try {
        if (socket.currentWhiteboard !== whiteboardId) {
          if (callback) callback({ success: false, message: '未加入该白板' });
          return;
        }

        const hasPermission = WhiteboardUser.hasPermission(whiteboardId, socket.userId, 'write');
        if (!hasPermission) {
          if (callback) callback({ success: false, message: '没有写权限' });
          return;
        }

        const room = getRoom(whiteboardId);
        const newSeq = room.lastSeq + 1;
        room.lastSeq = newSeq;

        const timestamp = new Date().toISOString();
        const opData = { elements };
        Operation.create(
          whiteboardId,
          socket.userId,
          'elements-set',
          opData,
          timestamp,
          newSeq
        );

        socket.to(whiteboardId).emit('elements-set', {
          elements,
          userId: socket.userId,
          username: socket.username
        });

        if (callback) {
          callback({
            success: true,
            opSeq: newSeq,
            timestamp
          });
        }
      } catch (err) {
        console.error('[Socket.IO] elements-set 错误:', err);
        if (callback) callback({ success: false, message: '操作失败: ' + err.message });
      }
    });

    socket.on('cursor-move', async ({ whiteboardId, cursor }, callback) => {
      try {
        if (socket.currentWhiteboard !== whiteboardId) {
          return;
        }

        const room = getRoom(whiteboardId);
        const userData = room.users.get(socket.userId);
        if (userData) {
          userData.cursor = cursor;
        }

        socket.to(whiteboardId).emit('cursor-move', {
          userId: socket.userId,
          username: socket.username,
          cursor
        });

        if (callback) callback({ success: true });
      } catch (err) {
        console.error('[Socket.IO] cursor-move 错误:', err);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    socket.on('save-whiteboard', async ({ whiteboardId, elements }, callback) => {
      try {
        if (socket.currentWhiteboard !== whiteboardId) {
          if (callback) callback({ success: false, message: '未加入该白板' });
          return;
        }

        const hasPermission = WhiteboardUser.hasPermission(whiteboardId, socket.userId, 'write');
        if (!hasPermission) {
          if (callback) callback({ success: false, message: '没有写权限' });
          return;
        }

        const whiteboard = Whiteboard.findById(whiteboardId);
        const newVersion = (whiteboard.version || 0) + 1;
        const currentData = {
          ...(whiteboard.current_data || {}),
          elements
        };
        Whiteboard.updateData(whiteboardId, currentData, newVersion);

        const updated = Whiteboard.findById(whiteboardId);

        io.to(whiteboardId).emit('whiteboard-saved', {
          whiteboard: {
            id: updated.id,
            name: updated.name,
            elements: updated.current_data?.elements || [],
            version: updated.version
          },
          savedBy: {
            id: socket.userId,
            username: socket.username
          },
          savedAt: new Date().toISOString()
        });

        if (callback) {
          callback({
            success: true,
            message: '保存成功',
            version: newVersion,
            whiteboard: {
              id: updated.id,
              name: updated.name,
              elements: updated.current_data?.elements || [],
              version: updated.version
            }
          });
        }

        console.log(`[Socket.IO] ${socket.username} 保存了白板 ${whiteboardId}，版本号: ${newVersion}`);
      } catch (err) {
        console.error('[Socket.IO] save-whiteboard 错误:', err);
        if (callback) callback({ success: false, message: '保存失败: ' + err.message });
      }
    });

    socket.on('leave-whiteboard', ({ whiteboardId }, callback) => {
      leaveWhiteboard(socket, io);
      if (callback) callback({ success: true, message: '已离开白板' });
    });

    socket.on('disconnect', () => {
      leaveWhiteboard(socket, io);
      console.log(`[Socket.IO] 用户断开连接: ${socket.username} (${socket.id})`);
    });
  });

  return io;
}

function leaveWhiteboard(socket, io) {
  if (!socket.currentWhiteboard) return;

  const whiteboardId = socket.currentWhiteboard;
  const room = whiteboardRooms.get(whiteboardId);

  if (room) {
    room.users.delete(socket.userId);

    socket.leave(whiteboardId);

    const userList = getUserList(room);

    io.to(whiteboardId).emit('user-left', {
      user: {
        id: socket.userId,
        username: socket.username,
        socketId: socket.id
      },
      users: userList
    });

    io.to(whiteboardId).emit('cursor-remove', {
      userId: socket.userId
    });

    if (room.users.size === 0) {
      whiteboardRooms.delete(whiteboardId);
    }
  }

  socket.currentWhiteboard = null;
}

module.exports = setupSocketIO;
