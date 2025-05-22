import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './models/database.js';
import authRoutes from './routes/auth.js';
import passwordRoutes from './routes/passwords.js';
// 确保 User 是小写字母开头的导入
import User from './models/user.js';  
// 保证 Reminder 的路径正确，注意大小写
import Reminder from './models/Reminder.js';
import { authenticateToken } from './middleware/auth.js';

dotenv.config();

const app = express();

// 中间件
app.use(cors({
  origin: '*',  // 允许所有来源
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// 路由
app.use('/auth', authRoutes);
app.use('/passwords', passwordRoutes);

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误' });
});

// const Reminder = sequelize.define('Reminder', {
//   passwordName: {
//     type: DataTypes.STRING,
//     allowNull: false
//   },
//   reminderTime: {
//     type: DataTypes.DATE,
//     allowNull: false
//   }
// });

// // Define association - reminders belong to a user
// Reminder.belongsTo(User);
// User.hasMany(Reminder);

// Get all reminders for logged in user
app.get('/reminders', authenticateToken, async (req, res) => {
  try {
    const reminders = await Reminder.findAll({
      where: { UserId: req.user.id }
    });
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new reminder
app.post('/reminders', authenticateToken, async (req, res) => {
  try {
    const { passwordName, reminderTime } = req.body;
    
    if (!passwordName || !reminderTime) {
      return res.status(400).json({ message: 'Password name and reminder time are required' });
    }
    
    const reminder = await Reminder.create({
      passwordName,
      reminderTime,
      UserId: req.user.id
    });
    
    res.status(201).json(reminder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a reminder
app.delete('/reminders/:id', authenticateToken, async (req, res) => {
  try {
    const reminder = await Reminder.findOne({
      where: {
        id: req.params.id,
        UserId: req.user.id
      }
    });
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }
    
    await reminder.destroy();
    res.json({ message: 'Reminder deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


const PORT = process.env.PORT || 3000;

// 启动服务器
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 等待数据库同步
    await sequelize.sync({ force: false }); 
    console.log('数据库表同步成功');
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`服务器运行在 http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('无法启动服务器:', error);
    process.exit(1);
  }
};

startServer();