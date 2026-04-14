import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Alternative = sequelize.define('Alternative', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  letter: {
    type: DataTypes.ENUM('A', 'B', 'C', 'D', 'E'),
    allowNull: false,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  image: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'alternatives',
  timestamps: false,
  indexes: [
    { fields: ['question_id'] },
  ],
});

export default Alternative;
