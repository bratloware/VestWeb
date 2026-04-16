import { QueryTypes } from 'sequelize';
import { Answer, Points, Streak } from '../db/models/index.js';
import sequelize from '../db/index.js';


// ─── Helpers ────────────────────────────────────────────────────────────────

const QUESTION_SELECT = `
  SELECT
    q.id,
    q.statement,
    q.year,
    q.difficulty,
    s.id   AS subject_id,
    s.name AS subject,
    v.id   AS vestibular_id,
    v.name AS vestibular,
    (
      SELECT a2.letter
      FROM alternatives a2
      WHERE a2.question_id = q.id AND a2.is_correct = true
      LIMIT 1
    ) AS "correctAlternative",
    json_agg(
      json_build_object(
        'id',        a.id,
        'letter',    a.letter,
        'text',      a.text,
        'is_correct', a.is_correct
      ) ORDER BY a.letter
    ) AS alternatives
  FROM questions q
  LEFT JOIN alternatives a ON a.question_id = q.id
  LEFT JOIN topics t ON t.id = q.topic_id
  LEFT JOIN subjects s ON s.id = t.subject_id
  LEFT JOIN question_vestibulares qv2 ON qv2.question_id = q.id
  LEFT JOIN vestibulares v ON v.id = qv2.vestibular_id
`;

// ─── Endpoints ──────────────────────────────────────────────────────────────

export const getAll = async (req, res) => {
  try {
    const { subject_id, vestibular_id, year, difficulty, limit = 20, offset = 0 } = req.query;

    const conditions = [];
    const replacements = { limit: parseInt(limit), offset: parseInt(offset) };

    if (subject_id) {
      conditions.push(`s.id = :subject_id`);
      replacements.subject_id = parseInt(subject_id);
    }

    if (vestibular_id) {
      conditions.push(`qv2.vestibular_id = :vestibular_id`);
      replacements.vestibular_id = parseInt(vestibular_id);
    }

    if (year) {
      conditions.push(`q.year = :year`);
      replacements.year = parseInt(year);
    }

    if (difficulty) {
      conditions.push(`q.difficulty = :difficulty`);
      replacements.difficulty = difficulty;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [questions, countRows] = await Promise.all([
      sequelize.query(
        `${QUESTION_SELECT} ${where} GROUP BY q.id, s.id, v.id ORDER BY RANDOM() LIMIT :limit OFFSET :offset`,
        { replacements, type: QueryTypes.SELECT },
      ),
      sequelize.query(
        `SELECT COUNT(DISTINCT q.id) AS count
         FROM questions q
         LEFT JOIN topics t ON t.id = q.topic_id
         LEFT JOIN subjects s ON s.id = t.subject_id
         LEFT JOIN question_vestibulares qv2 ON qv2.question_id = q.id
         LEFT JOIN vestibulares v ON v.id = qv2.vestibular_id
         ${where}`,
        { replacements, type: QueryTypes.SELECT },
      ),
    ]);

    return res.json({
      message: 'Questions fetched',
      data: { count: parseInt(countRows[0].count), rows: questions },
    });
  } catch (error) {
    console.error('getAll questions error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const [question] = await sequelize.query(
      `${QUESTION_SELECT} WHERE q.id = :id GROUP BY q.id`,
      { replacements: { id: parseInt(id) }, type: QueryTypes.SELECT },
    );
    if (!question) return res.status(404).json({ message: 'Question not found' });
    return res.json({ message: 'Question fetched', data: question });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getSubjects = async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT id, name FROM subjects ORDER BY id`,
      { type: QueryTypes.SELECT },
    );
    return res.json({ message: 'Subjects fetched', data: rows });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getTopics = async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT t.id, t.name, t.subject_id, s.name AS subject_name
       FROM topics t
       JOIN subjects s ON s.id = t.subject_id
       ORDER BY s.name, t.name`,
      { type: QueryTypes.SELECT },
    );
    return res.json({ message: 'Topics fetched', data: rows });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getVestibulares = async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT id, name, full_name FROM vestibulares ORDER BY name`,
      { type: QueryTypes.SELECT },
    );
    return res.json({ message: 'Vestibulares fetched', data: rows });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getYears = async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT DISTINCT year FROM questions WHERE bank = 'ENEM' AND year IS NOT NULL ORDER BY year DESC`,
      { type: QueryTypes.SELECT },
    );
    return res.json({ message: 'Years fetched', data: rows.map(r => r.year) });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ─── Answer submission ───────────────────────────────────────────────────────

export const submitAnswer = async (req, res) => {
  try {
    const { session_id, question_id, chosen_alternative_id, response_time_seconds } = req.body;
    const student_id = req.user.id;

    const [alt] = await sequelize.query(
      `SELECT is_correct FROM alternatives WHERE id = :id`,
      { replacements: { id: chosen_alternative_id }, type: QueryTypes.SELECT },
    );
    const is_correct = alt ? alt.is_correct : false;

    const answer = await Answer.create({
      session_id,
      question_id,
      chosen_alternative_id,
      is_correct,
      student_id,
      response_time_seconds,
    });

    if (is_correct) {
      await Points.create({ student_id, amount: 10, reason: 'correct_answer' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const streak = await Streak.findOne({ where: { student_id } });
    if (!streak) {
      await Streak.create({ student_id, current_streak: 1, longest_streak: 1, last_activity_date: today });
    } else if (streak.last_activity_date !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      const new_streak = streak.last_activity_date === yesterday ? streak.current_streak + 1 : 1;
      await streak.update({
        current_streak: new_streak,
        longest_streak: Math.max(new_streak, streak.longest_streak),
        last_activity_date: today,
      });
    }

    return res.json({ message: 'Answer submitted', data: { answer, is_correct } });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const startPracticeSession = async (req, res) => {
  try {
    const { QuestionSession } = await import('../db/models/index.js');
    const session = await QuestionSession.create({
      student_id: req.user.id,
      simulation_id: null,
      mode: 'practice',
    });
    return res.status(201).json({ message: 'Session started', data: session });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const setTargetVestibular = async (req, res) => {
  try {
    const { vestibular_id } = req.body;
    await req.user.update({ target_vestibular_id: vestibular_id || null });
    return res.json({ message: 'Target vestibular updated', data: { target_vestibular_id: vestibular_id } });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
