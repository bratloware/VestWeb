import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Simulation = sequelize.define('Simulation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  subject_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard', 'mixed'),
    defaultValue: 'mixed',
  },
  total_questions: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  time_limit_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 60,
  },
  is_weekly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'simulations',
  timestamps: false,
});

export default Simulation;
