import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const QuestionSession = sequelize.define('QuestionSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  simulation_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  started_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  finished_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  mode: {
    type: DataTypes.ENUM('simulation', 'practice'),
    defaultValue: 'practice',
  },
}, {
  tableName: 'question_sessions',
  timestamps: false,
});

export default QuestionSession;
