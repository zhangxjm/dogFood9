const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { generateToken } = require('../middleware');

router.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }

  if (username.length < 3) {
    return res.status(400).json({ message: '用户名至少需要3个字符' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: '密码至少需要6个字符' });
  }

  const existingUser = User.findByUsername(username);
  if (existingUser) {
    return res.status(400).json({ message: '用户名已存在' });
  }

  const user = User.create(username, password);
  const token = generateToken(user);

  res.status(201).json({
    message: '注册成功',
    user,
    token
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }

  const user = User.findByUsername(username);
  if (!user) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const isValid = User.verifyPassword(user, password);
  if (!isValid) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const token = generateToken(user);
  const userInfo = {
    id: user.id,
    username: user.username,
    created_at: user.created_at
  };

  res.json({
    message: '登录成功',
    user: userInfo,
    token
  });
});

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未登录' });
  }

  const token = authHeader.substring(7);
  const { verifyToken } = require('../middleware');
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: '令牌无效' });
  }

  const user = User.findById(decoded.id);
  if (!user) {
    return res.status(404).json({ message: '用户不存在' });
  }

  res.json({ user });
});

module.exports = router;
