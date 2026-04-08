import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Subtopic = sequelize.define('Subtopic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  topic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'subtopics',
  timestamps: false,
});

export default Subtopic;
