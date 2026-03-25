import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const StudentBadge = sequelize.define('StudentBadge', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  badge_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  earned_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'student_badges',
  timestamps: false,
});

export default StudentBadge;
