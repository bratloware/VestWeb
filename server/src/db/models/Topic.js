import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Topic = sequelize.define('Topic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  subject_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'topics',
  timestamps: false,
});

export default Topic;
