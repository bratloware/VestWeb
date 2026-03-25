import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Streak = sequelize.define('Streak', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  current_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  longest_streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  last_activity_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
}, {
  tableName: 'streaks',
  timestamps: false,
});

export default Streak;
