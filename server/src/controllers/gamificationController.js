import { Points, Badge, StudentBadge, Streak, Student, Answer, QuestionSession } from '../db/models/index.js';
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

export const getMyMetrics = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Total respondidas e acertos gerais
    const [totalStats] = await sequelize.query(
      `SELECT COUNT(id) AS total, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) AS correct
       FROM answers WHERE student_id = :studentId`,
      { replacements: { studentId }, type: sequelize.QueryTypes.SELECT }
    );
    const total = parseInt(totalStats?.total || 0);
    const correct = parseInt(totalStats?.correct || 0);
    const overallAccuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Desempenho por matéria
    const subjectStats = await sequelize.query(
      `SELECT s.name AS subject_name,
              COUNT(a.id) AS total,
              SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END) AS correct
       FROM answers a
       JOIN questions q ON a.question_id = q.id
       JOIN topics t ON q.topic_id = t.id
       JOIN subjects s ON t.subject_id = s.id
       WHERE a.student_id = :studentId
       GROUP BY s.id, s.name
       ORDER BY s.name`,
      { replacements: { studentId }, type: sequelize.QueryTypes.SELECT }
    );

    const subjects = subjectStats.map(s => {
      const tot = parseInt(s.total);
      const cor = parseInt(s.correct);
      return {
        name: s.subject_name,
        total: tot,
        correct: cor,
        accuracy: tot > 0 ? Math.round((cor / tot) * 100) : 0,
      };
    });

    // Últimas 7 sessões
    const sessions = await QuestionSession.findAll({
      where: { student_id: studentId },
      include: [{ model: Answer, as: 'answers', attributes: ['is_correct'] }],
      order: [['started_at', 'DESC']],
      limit: 7,
    });

    const sessionData = sessions.reverse().map(s => {
      const answers = s.answers || [];
      const tot = answers.length;
      const cor = answers.filter(a => a.is_correct).length;
      return {
        label: new Date(s.started_at).toLocaleDateString('pt-BR', { weekday: 'short' }),
        score: tot > 0 ? Math.round((cor / tot) * 100) : 0,
        date: s.started_at,
      };
    });

    return res.json({
      message: 'Metrics fetched',
      data: { total_answered: total, overall_accuracy: overallAccuracy, subjects, sessions: sessionData },
    });
  } catch (error) {
    console.error('getMyMetrics error:', error);
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
