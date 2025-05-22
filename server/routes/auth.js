import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const router = express.Router();

// 注册
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('注册请求:', { email, password }); // 添加日志

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: '邮箱格式不正确' });
    }

    // 验证密码强度
    if (password.length < 8) {
      return res.status(400).json({ message: '密码长度至少为8位' });
    }

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建新用户
    const user = await User.create({
      email,
      password: hashedPassword
    });

    console.log('用户创建成功:', user.id); // 添加日志

    // 生成 JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // token 24小时后过期
    );

    // 返回用户信息和token
    res.status(201).json({ 
      message: '注册成功',
      user: {
        id: user.id,
        email: user.email
      },
      token 
    });

  } catch (error) {
    console.error('注册错误:', error); // 添加错误日志
    res.status(500).json({ 
      message: '注册失败',
      error: error.message 
    });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('登录请求:', { email }); // 添加日志

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: '邮箱格式不正确' });
    }

    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: '密码错误' });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 返回用户信息和token
    res.json({ 
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email
      },
      token 
    });

  } catch (error) {
    console.error('登录错误:', error); // 添加错误日志
    res.status(500).json({ 
      message: '登录失败',
      error: error.message 
    });
  }
});

// 健康检查路由
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

export default router;