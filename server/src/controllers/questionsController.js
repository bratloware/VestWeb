import { QueryTypes } from 'sequelize';
import { Answer, Points, Streak } from '../db/models/index.js';
import sequelize from '../db/index.js';

// Mapeamento subject_id (int) ↔ discipline (string da tabela "Question")
const DISCIPLINE_MAP = {
  1: 'ciencias-humanas',
  2: 'ciencias-natureza',
  3: 'linguagens',
  4: 'matematica',
};

const SUBJECTS_LIST = [
  { id: 1, name: 'Ciências Humanas e suas Tecnologias',       topics: [] },
  { id: 2, name: 'Ciências da Natureza e suas Tecnologias',   topics: [] },
  { id: 3, name: 'Linguagens, Códigos e suas Tecnologias',    topics: [] },
  { id: 4, name: 'Matemática e suas Tecnologias',             topics: [] },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const QUESTION_SELECT = `
  SELECT
    q.id,
    q.title,
    q.index,
    q.year,
    q.discipline,
    q.language,
    q.context                  AS statement,
    q.files->>0                AS image,
    q."correctAlternative",
    q."alternativesIntroduction",
    json_agg(
      json_build_object(
        'id',        a.id,
        'letter',    a.letter,
        'text',      a.text,
        'file',      a.file,
        'is_correct', a."isCorrect"
      ) ORDER BY a.letter
    ) AS alternatives
  FROM "Question" q
  LEFT JOIN "Alternative" a ON a."questionId" = q.id
`;

// ─── Endpoints ──────────────────────────────────────────────────────────────

export const getAll = async (req, res) => {
  try {
    const { subject_id, vestibular_id, limit = 20, offset = 0 } = req.query;

    const conditions = ['q.language IS NULL'];
    const replacements = { limit: parseInt(limit), offset: parseInt(offset) };

    if (subject_id && DISCIPLINE_MAP[subject_id]) {
      conditions.push(`q.discipline = :discipline`);
      replacements.discipline = DISCIPLINE_MAP[subject_id];
    }

    if (vestibular_id) {
      conditions.push(`q.year = :year`);
      replacements.year = parseInt(vestibular_id);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [questions, countRows] = await Promise.all([
      sequelize.query(
        `${QUESTION_SELECT} ${where} GROUP BY q.id ORDER BY RANDOM() LIMIT :limit OFFSET :offset`,
        { replacements, type: QueryTypes.SELECT },
      ),
      sequelize.query(
        `SELECT COUNT(*) AS count FROM "Question" q ${where}`,
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
  return res.json({ message: 'Subjects fetched', data: SUBJECTS_LIST });
};

export const getVestibulares = async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT year AS id, title AS name FROM "Exam" ORDER BY year DESC`,
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
      `SELECT year FROM "Exam" ORDER BY year DESC`,
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

    // Busca na tabela Prisma "Alternative"
    const [alt] = await sequelize.query(
      `SELECT "isCorrect" FROM "Alternative" WHERE id = :id`,
      { replacements: { id: chosen_alternative_id }, type: QueryTypes.SELECT },
    );
    const is_correct = alt ? alt.isCorrect : false;

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
