import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const SimulationQuestion = sequelize.define('SimulationQuestion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  simulation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  question_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'simulation_questions',
  timestamps: false,
});

export default SimulationQuestion;
