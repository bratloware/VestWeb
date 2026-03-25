import { DataTypes } from 'sequelize';
import sequelize from '../index.js';

const VideoProgress = sequelize.define('VideoProgress', {
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
  watched: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  progress_seconds: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'video_progress',
  timestamps: false,
});

export default VideoProgress;
