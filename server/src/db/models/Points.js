import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Points = sequelize.define('Points', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reason: {
    type: DataTypes.ENUM('correct_answer', 'simulation', 'streak', 'community'),
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'points',
  timestamps: false,
});

export default Points;
