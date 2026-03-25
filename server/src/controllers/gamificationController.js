import { Points, Badge, StudentBadge, Streak, Student } from '../db/models/index.js';
import sequelize from '../db/index.js';

export const getMyPoints = async (req, res) => {
  try {
    const result = await Points.findAll({
      where: { student_id: req.user.id },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total_points']],
      raw: true,
    });
    const total_points = result[0]?.total_points || 0;
    return res.json({ message: 'Points fetched', data: { total_points } });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getMyBadges = async (req, res) => {
  try {
    const badges = await StudentBadge.findAll({
      where: { student_id: req.user.id },
      include: [{ model: Badge, as: 'badge' }],
      order: [['earned_at', 'DESC']],
    });
    return res.json({ message: 'Badges fetched', data: badges });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getMyStreak = async (req, res) => {
  try {
    const streak = await Streak.findOne({ where: { student_id: req.user.id } });
    return res.json({ message: 'Streak fetched', data: streak || { current_streak: 0, longest_streak: 0, last_activity_date: null } });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Points.findAll({
      attributes: ['student_id', [sequelize.fn('SUM', sequelize.col('amount')), 'total_points']],
      include: [{ model: Student, as: 'student', attributes: ['id', 'name', 'avatar_url', 'enrollment'] }],
      group: ['student_id', 'student.id'],
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']],
      limit: 20,
    });
    return res.json({ message: 'Leaderboard fetched', data: leaderboard });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
