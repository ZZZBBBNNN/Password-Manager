// import { DataTypes } from 'sequelize';
// import { sequelize } from './database.js';

// const Password = sequelize.define('Password', {
//   id: {
//     type: DataTypes.UUID,
//     defaultValue: DataTypes.UUIDV4,
//     primaryKey: true
//   },
//   appName: {
//     type: DataTypes.STRING,
//     allowNull: false
//   },
//   username: {
//     type: DataTypes.STRING,
//     allowNull: false
//   },
//   password: {
//     type: DataTypes.STRING,
//     allowNull: false
//   },
//   userId: {
//     type: DataTypes.UUID,
//     allowNull: false
//   }
// });

// export default Password;


import { DataTypes } from 'sequelize';
import sequelize from './database.js';

const Password = sequelize.define('Password', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  appName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '应用或网站名称'
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '该应用的用户名/账号'
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '该应用的密码'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联的用户ID'
  }
});

export default Password;