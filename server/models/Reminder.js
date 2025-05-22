import { DataTypes } from 'sequelize';
import sequelize from './database.js';
import User from './user.js';  

const Reminder = sequelize.define('Reminder', {
  passwordName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reminderTime: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

// 定义关联
Reminder.belongsTo(User);
User.hasMany(Reminder);

export default Reminder;