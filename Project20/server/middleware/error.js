function errorHandler(err, req, res, next) {
  console.error('服务端错误:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: '数据验证失败',
      errors: err.errors
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: '认证失败'
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(400).json({
      message: '数据冲突：记录已存在'
    });
  }

  res.status(500).json({
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}

function notFoundHandler(req, res, next) {
  res.status(404).json({
    message: `未找到路由 ${req.method} ${req.originalUrl}`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
