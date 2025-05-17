import Sequelize from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

let sequelize;

// 根据环境变量选择连接方式
if (process.env.DB_URL) {
  // 使用连接URL
  sequelize = new Sequelize(process.env.DB_URL, {
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // 使用独立参数
  sequelize = new Sequelize(
    process.env.DB_NAME || 'passwordmanager',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'db',
      dialect: 'postgres',
      port: process.env.DB_PORT || 5432,
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
}

// 测试数据库连接
sequelize.authenticate()
  .then(() => {
    console.log('数据库连接成功');
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
  });

export default sequelize;