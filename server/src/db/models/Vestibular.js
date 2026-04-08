import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Vestibular = sequelize.define('Vestibular', {
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
  full_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  institution: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(2),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'vestibulares',
  timestamps: false,
});

export default Vestibular;
