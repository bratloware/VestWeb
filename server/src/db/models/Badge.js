import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Badge = sequelize.define('Badge', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  icon_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  condition: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'badges',
  timestamps: false,
});

export default Badge;
