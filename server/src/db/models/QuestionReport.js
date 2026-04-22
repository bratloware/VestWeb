import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const QuestionReport = sequelize.define('QuestionReport', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  question_id: { type: DataTypes.INTEGER, allowNull: false },
  student_id: { type: DataTypes.INTEGER, allowNull: false },
  error_type: {
    type: DataTypes.ENUM(
      'wrong_answer',
      'typo',
      'image_missing',
      'unclear_statement',
      'wrong_subject',
      'other',
    ),
    allowNull: false,
  },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'resolved', 'dismissed'),
    allowNull: false,
    defaultValue: 'pending',
  },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'question_reports',
  timestamps: false,
});

export default QuestionReport;
