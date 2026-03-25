import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const FavoriteVideo = sequelize.define('FavoriteVideo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  video_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'favorite_videos',
  timestamps: false,
});

export default FavoriteVideo;
