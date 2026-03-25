import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const InstitutionalVideo = sequelize.define('InstitutionalVideo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  youtube_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'institutional_videos',
  timestamps: false,
});

export default InstitutionalVideo;
