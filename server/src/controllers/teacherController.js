import { Mentor, MentoringSession, Student, Question, Alternative, Topic, Subject } from '../db/models/index.js';

export const getProfile = async (req, res) => {
  try {
    const mentor = await Mentor.findOne({
      where: { student_id: req.user.id },
      include: [{ model: Student, as: 'student', attributes: ['id', 'name', 'email', 'avatar_url', 'specialty', 'bio'] }],
    });
    return res.json({ message: 'Profile fetched', data: mentor });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getMySessions = async (req, res) => {
  try {
    const mentor = await Mentor.findOne({ where: { student_id: req.user.id } });
    if (!mentor) return res.status(404).json({ message: 'Perfil de mentor não encontrado' });

    const sessions = await MentoringSession.findAll({
      where: { mentor_id: mentor.id },
      include: [
        { model: Student, as: 'student', attributes: ['id', 'name', 'avatar_url', 'enrollment'] },
      ],
      order: [['scheduled_at', 'DESC']],
    });
    return res.json({ message: 'Sessions fetched', data: sessions });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const session = await MentoringSession.findByPk(id);
    if (!session) return res.status(404).json({ message: 'Sessão não encontrada' });

    const mentor = await Mentor.findOne({ where: { student_id: req.user.id } });
    if (!mentor || session.mentor_id !== mentor.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await session.update({ status, notes: notes ?? session.notes });
    return res.json({ message: 'Session updated', data: session });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getMyQuestions = async (req, res) => {
  try {
    const questions = await Question.findAll({
      where: { created_by: req.user.id },
      include: [
        { model: Alternative, as: 'alternatives' },
        { model: Topic, as: 'topic', include: [{ model: Subject, as: 'subject' }] },
      ],
      order: [['created_at', 'DESC']],
    });
    return res.json({ message: 'Questions fetched', data: questions });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const { statement, topic_id, difficulty, source, year, bank, alternatives } = req.body;
    if (!statement || !topic_id || !difficulty) {
      return res.status(400).json({ message: 'statement, topic_id e difficulty são obrigatórios' });
    }

    const question = await Question.create({
      statement, topic_id, difficulty, source, year, bank, created_by: req.user.id,
    });

    if (alternatives && Array.isArray(alternatives)) {
      for (const alt of alternatives) {
        await Alternative.create({ question_id: question.id, ...alt });
      }
    }

    const full = await Question.findByPk(question.id, {
      include: [
        { model: Alternative, as: 'alternatives' },
        { model: Topic, as: 'topic', include: [{ model: Subject, as: 'subject' }] },
      ],
    });

    return res.status(201).json({ message: 'Question created', data: full });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByPk(id);
    if (!question) return res.status(404).json({ message: 'Questão não encontrada' });

    if (question.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { statement, topic_id, difficulty, source, year, bank } = req.body;
    await question.update({ statement, topic_id, difficulty, source, year, bank });
    return res.json({ message: 'Question updated', data: question });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByPk(id);
    if (!question) return res.status(404).json({ message: 'Questão não encontrada' });

    if (question.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await question.destroy();
    return res.json({ message: 'Question deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
