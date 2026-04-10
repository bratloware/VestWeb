import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const Essay = sequelize.define('Essay', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  file_path: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  original_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  file_type: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'corrected'),
    defaultValue: 'pending',
    allowNull: false,
  },
  nota_total: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  c1_nota: { type: DataTypes.INTEGER, allowNull: true },
  c1_comentario: { type: DataTypes.TEXT, allowNull: true },
  c2_nota: { type: DataTypes.INTEGER, allowNull: true },
  c2_comentario: { type: DataTypes.TEXT, allowNull: true },
  c3_nota: { type: DataTypes.INTEGER, allowNull: true },
  c3_comentario: { type: DataTypes.TEXT, allowNull: true },
  c4_nota: { type: DataTypes.INTEGER, allowNull: true },
  c4_comentario: { type: DataTypes.TEXT, allowNull: true },
  c5_nota: { type: DataTypes.INTEGER, allowNull: true },
  c5_comentario: { type: DataTypes.TEXT, allowNull: true },
  comentario_geral: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  pontos_positivos: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  pontos_melhorar: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  corrected_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  corrected_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'essays',
  timestamps: false,
});

export default Essay;
