const express = require('express');
const router = express.Router();
const { Whiteboard, WhiteboardUser, Version, Operation } = require('../models');
const { authMiddleware, requireWhiteboardPermission } = require('../middleware');

router.use(authMiddleware);

router.get('/:id/versions', requireWhiteboardPermission('read'), (req, res) => {
  const { id } = req.params;
  const versions = Version.findByWhiteboard(id);
  res.json({
    versions,
    total: versions.length
  });
});

router.post('/:id/versions', requireWhiteboardPermission('write'), (req, res) => {
  const { id } = req.params;
  const { snapshot_name } = req.body;

  const whiteboard = Whiteboard.findById(id);
  if (!whiteboard) {
    return res.status(404).json({ message: '白板不存在' });
  }

  const snapshotName = snapshot_name || `快照_${new Date().toLocaleString('zh-CN')}`;

  const version = Version.create(
    id,
    whiteboard.current_data,
    snapshotName,
    req.user.id
  );

  res.status(201).json({
    message: '快照创建成功',
    version
  });
});

router.get('/:id/versions/:vid', requireWhiteboardPermission('read'), (req, res) => {
  const { id, vid } = req.params;
  const version = Version.findById(vid);

  if (!version || version.whiteboard_id !== id) {
    return res.status(404).json({ message: '版本不存在' });
  }

  res.json({ version });
});

router.post('/:id/versions/:vid/restore', requireWhiteboardPermission('write'), (req, res) => {
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
    whiteboard: updatedWhiteboard
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
