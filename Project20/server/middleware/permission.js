const { WhiteboardUser } = require('../models');

function requireWhiteboardPermission(minPermission = 'read') {
  return (req, res, next) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: '未登录' });
    }

    const hasPermission = WhiteboardUser.hasPermission(id, userId, minPermission);

    if (!hasPermission) {
      return res.status(403).json({ message: '权限不足' });
    }

    next();
  };
}

function requireWhiteboardOwner(req, res, next) {
  const { id } = req.params;
  const { Whiteboard } = require('../models');
  const whiteboard = Whiteboard.findById(id);

  if (!whiteboard) {
    return res.status(404).json({ message: '白板不存在' });
  }

  if (whiteboard.owner_id !== req.user?.id) {
    return res.status(403).json({ message: '仅白板所有者可执行此操作' });
  }

  req.whiteboard = whiteboard;
  next();
}

module.exports = {
  requireWhiteboardPermission,
  requireWhiteboardOwner
};
