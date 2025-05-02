// import { Sequelize } from 'sequelize';
// import dotenv from 'dotenv';

// dotenv.config();

// export const sequelize = new Sequelize(process.env.DB_URL, {
//   dialect: 'postgres',
//   logging: false,
//   pool: {
//     max: 5,
//     min: 0,
//     acquire: 30000,
//     idle: 10000
//   }
// });

// // 测试数据库连接
// sequelize.authenticate()
//   .then(() => console.log('数据库连接成功'))
//   .catch(err => console.error('数据库连接失败:', err));
import sequelize from './database.js';
import User from './user.js';
import Password from './password.js';

// 同步所有模型到数据库
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('数据库同步成功');
  } catch (error) {
    console.error('数据库同步失败:', error);
  }
};

// 执行同步
syncDatabase();

// 导出所有内容
export { sequelize, User, Password };