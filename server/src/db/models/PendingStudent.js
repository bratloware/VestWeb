import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const PendingStudent = sequelize.define('PendingStudent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  stripe_session_id: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  password_hash: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  target_vestibular_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'pending_students',
  timestamps: false,
});

export default PendingStudent;
