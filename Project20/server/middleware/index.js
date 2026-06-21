const {
  generateToken,
  verifyToken,
  authMiddleware,
  optionalAuthMiddleware
} = require('./auth');

const {
  errorHandler,
  notFoundHandler
} = require('./error');

const {
  requireWhiteboardPermission,
  requireWhiteboardOwner
} = require('./permission');

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  optionalAuthMiddleware,
  errorHandler,
  notFoundHandler,
  requireWhiteboardPermission,
  requireWhiteboardOwner
};
