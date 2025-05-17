import express from 'express';
import Password from '../models/password.js';
import { authenticateToken } from '../middleware/auth.js';
import { encrypt, decrypt } from '../utils/encryption.js';

const router = express.Router();
router.use(authenticateToken);

// 添加新密码
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { appName, username, password } = req.body;
    const encryptedPassword = encrypt(password);
    
    const newPassword = await Password.create({
      appName,
      username,
      password: encryptedPassword,
      userId: req.user.id
    });
    
    res.status(201).json({
      ...newPassword.toJSON(),
      password: password // 返回原始密码而非加密值
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// 获取所有密码
router.get('/', authenticateToken, async (req, res) => {
  try {
    const passwords = await Password.findAll({
      where: { userId: req.user.id }
    });
    
    // 解密密码
    const decryptedPasswords = passwords.map(item => {
      const plain = item.toJSON();
      return {
        ...plain,
        password: decrypt(plain.password)
      };
    });
    
    res.json(decryptedPasswords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 添加新密码
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { appName, username, password } = req.body;
    const newPassword = await Password.create({
      appName,
      username,
      password,
      userId: req.user.id
    });
    res.status(201).json(newPassword);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 更新密码
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;
    const passwordRecord = await Password.findOne({
      where: { id, userId: req.user.id }
    });
    
    if (!passwordRecord) {
      return res.status(404).json({ message: '密码记录未找到' });
    }

    await passwordRecord.update({ username, password });
    res.json(passwordRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 删除密码
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const passwordRecord = await Password.findOne({
      where: { id, userId: req.user.id }
    });
    
    if (!passwordRecord) {
      return res.status(404).json({ message: '密码记录未找到' });
    }

    await passwordRecord.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
