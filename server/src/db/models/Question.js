import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  statement: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  topic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  subtopic_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'medium', 'hard'),
    allowNull: false,
    defaultValue: 'medium',
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  bank: {
    type: DataTypes.STRING(100),
    allowNull: true,
    index: true,
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
  tableName: 'questions',
  timestamps: false,
});

export default Question;
