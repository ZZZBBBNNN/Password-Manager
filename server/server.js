import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './models/database.js';
import authRoutes from './routes/auth.js';
import passwordRoutes from './routes/passwords.js';

dotenv.config();

const app = express();

// 中间件
app.use(cors());
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

const PORT = process.env.PORT || 3000;

// 启动服务器
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 等待数据库同步
    await sequelize.sync({ force: true }); 
    console.log('数据库表同步成功');
    
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('无法启动服务器:', error);
    process.exit(1);
  }
};

startServer();