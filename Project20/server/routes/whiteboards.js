const express = require('express');
const router = express.Router();
const { Whiteboard, WhiteboardUser, Version, Operation } = require('../models');
const { authMiddleware, requireWhiteboardPermission, requireWhiteboardOwner } = require('../middleware');

router.use(authMiddleware);

router.get('/', (req, res) => {
  const whiteboards = Whiteboard.findByUserId(req.user.id);
  const list = whiteboards.map(wb => ({
    id: wb.id,
    name: wb.name,
    ownerId: wb.owner_id,
    ownerName: wb.owner_name,
    version: wb.version,
    elementCount: wb.current_data?.elements?.length || 0,
    createdAt: wb.created_at,
    updatedAt: wb.updated_at
  }));
  res.json({
    whiteboards: list,
    total: list.length
  });
});

router.post('/', (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: '白板名称不能为空' });
  }

  const whiteboard = Whiteboard.create(name.trim(), req.user.id);

  res.status(201).json({
    message: '白板创建成功',
    whiteboard: {
      id: whiteboard.id,
      name: whiteboard.name,
      ownerId: whiteboard.owner_id,
      ownerName: whiteboard.owner_name,
      version: whiteboard.version,
      elements: whiteboard.current_data?.elements || [],
      createdAt: whiteboard.created_at,
      updatedAt: whiteboard.updated_at
    }
  });
});

router.get('/:id', requireWhiteboardPermission('read'), (req, res) => {
  const { id } = req.params;
  const whiteboard = Whiteboard.findById(id);

  if (!whiteboard) {
    return res.status(404).json({ message: '白板不存在' });
  }

  const users = WhiteboardUser.findByWhiteboard(id);
  const maxSeq = Operation.getMaxSeq(id);

  res.json({
    id: whiteboard.id,
    name: whiteboard.name,
    ownerId: whiteboard.owner_id,
    ownerName: whiteboard.owner_name,
    version: whiteboard.version,
    elements: whiteboard.current_data?.elements || [],
    background: whiteboard.current_data?.background || '#ffffff',
    users,
    maxSeq,
    createdAt: whiteboard.created_at,
    updatedAt: whiteboard.updated_at
  });
});

router.put('/:id', requireWhiteboardPermission('write'), (req, res) => {
  const { id } = req.params;
  const { name, elements } = req.body;

  const whiteboard = Whiteboard.findById(id);
  if (!whiteboard) {
    return res.status(404).json({ message: '白板不存在' });
  }

  const updates = {};
  if (name !== undefined && name.trim()) {
    updates.name = name.trim();
  }
  if (elements !== undefined) {
    const currentData = {
      ...(whiteboard.current_data || {}),
      elements
    };
    updates.current_data = currentData;
    updates.version = (whiteboard.version || 0) + 1;
  }

  const updated = Whiteboard.update(id, updates);

  res.json({
    message: '白板更新成功',
    whiteboard: {
      id: updated.id,
      name: updated.name,
      version: updated.version,
      elements: updated.current_data?.elements || []
    }
  });
});

router.delete('/:id', requireWhiteboardOwner, (req, res) => {
  const { id } = req.params;
  Whiteboard.delete(id);
  res.json({ message: '白板删除成功' });
});

router.get('/:id/users', requireWhiteboardPermission('read'), (req, res) => {
  const { id } = req.params;
  const users = WhiteboardUser.findByWhiteboard(id);
  res.json({ users });
});

router.post('/:id/users', requireWhiteboardPermission('admin'), (req, res) => {
  const { id } = req.params;
  const { user_id, permission = 'read' } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: '用户ID不能为空' });
  }

  const validPermissions = ['read', 'write', 'admin'];
  if (!validPermissions.includes(permission)) {
    return res.status(400).json({ message: '无效的权限类型' });
  }

  const result = WhiteboardUser.addUser(id, user_id, permission);
  res.status(201).json({
    message: '用户添加成功',
    user: result
  });
});

router.put('/:id/users/:userId', requireWhiteboardPermission('admin'), (req, res) => {
  const { id, userId } = req.params;
  const { permission } = req.body;

  const validPermissions = ['read', 'write', 'admin'];
  if (!validPermissions.includes(permission)) {
    return res.status(400).json({ message: '无效的权限类型' });
  }

  const result = WhiteboardUser.updatePermission(id, userId, permission);
  res.json({
    message: '权限更新成功',
    user: result
  });
});

router.delete('/:id/users/:userId', requireWhiteboardPermission('admin'), (req, res) => {
  const { id, userId } = req.params;
  WhiteboardUser.removeUser(id, userId);
  res.json({ message: '用户移除成功' });
});

router.get('/:id/versions', requireWhiteboardPermission('read'), (req, res) => {
  const { id } = req.params;
  const rawVersions = Version.findByWhiteboard(id);
  const versions = rawVersions.map(v => ({
    id: v.id,
    whiteboardId: v.whiteboard_id,
    snapshotName: v.snapshot_name,
    elements: v.data?.elements || [],
    createdBy: v.created_by_name || v.created_by,
    createdAt: v.created_at
  }));
  res.json(versions);
});

router.post('/:id/versions', requireWhiteboardPermission('write'), (req, res) => {
  const { id } = req.params;
  const { snapshot_name, elements } = req.body;

  const whiteboard = Whiteboard.findById(id);
  if (!whiteboard) {
    return res.status(404).json({ message: '白板不存在' });
  }

  const snapshotName = snapshot_name || `快照_${new Date().toLocaleString('zh-CN')}`;
  let dataToSave = whiteboard.current_data;
  if (elements !== undefined) {
    dataToSave = {
      ...(whiteboard.current_data || {}),
      elements
    };
  }

  const version = Version.create(
    id,
    dataToSave,
    snapshotName,
    req.user.id
  );

  res.status(201).json({
    message: '快照创建成功',
    version: {
      id: version.id,
      snapshotName: version.snapshot_name,
      elements: version.data?.elements || [],
      createdBy: version.created_by_name || version.created_by,
      createdAt: version.created_at
    }
  });
});

router.get('/:id/versions/:vid', requireWhiteboardPermission('read'), (req, res) => {
  const { id, vid } = req.params;
  const version = Version.findById(vid);

  if (!version || version.whiteboard_id !== id) {
    return res.status(404).json({ message: '版本不存在' });
  }

  res.json({
    id: version.id,
    snapshotName: version.snapshot_name,
    elements: version.data?.elements || [],
    createdBy: version.created_by_name || version.created_by,
    createdAt: version.created_at
  });
});

router.post('/:id/versions/:vid/restore', requireWhiteboardPermission('write'), async (req, res) => {
  const { id, vid } = req.params;

  const version = Version.findById(vid);
  if (!version || version.whiteboard_id !== id) {
    return res.status(404).json({ message: '版本不存在' });
  }

  const whiteboard = Whiteboard.findById(id);
  const newVersion = (whiteboard.version || 0) + 1;
  Whiteboard.updateData(id, version.data, newVersion);
  Operation.deleteByWhiteboard(id);

  const updatedWhiteboard = Whiteboard.findById(id);

  res.json({
    message: '版本恢复成功',
    whiteboard: {
      id: updatedWhiteboard.id,
      name: updatedWhiteboard.name,
      version: newVersion,
      elements: updatedWhiteboard.current_data?.elements || []
    }
  });
});

router.delete('/:id/versions/:vid', requireWhiteboardPermission('admin'), (req, res) => {
  const { id, vid } = req.params;

  const version = Version.findById(vid);
  if (!version || version.whiteboard_id !== id) {
    return res.status(404).json({ message: '版本不存在' });
  }

  Version.delete(vid);
  res.json({ message: '快照删除成功' });
});

module.exports = router;
