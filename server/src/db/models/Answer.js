import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Answer = sequelize.define('Answer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  session_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  chosen_alternative_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  response_time_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  answered_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'answers',
  timestamps: false,
});

export default Answer;
