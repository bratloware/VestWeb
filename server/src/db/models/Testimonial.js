import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Testimonial = sequelize.define('Testimonial', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  photo_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  course: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  university: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'testimonials',
  timestamps: false,
});

export default Testimonial;
