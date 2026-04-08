import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const QuestionVestibular = sequelize.define('QuestionVestibular', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  vestibular_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'question_vestibulares',
  timestamps: false,
});

export default QuestionVestibular;
