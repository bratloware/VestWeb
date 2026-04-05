import { Question, Alternative, Topic, Subject, Answer, QuestionSession, Points, Streak } from '../db/models/index.js';
import { Op } from 'sequelize';

export const getAll = async (req, res) => {
  try {
    const { subject_id, topic_id, difficulty, bank, limit = 10, offset = 0 } = req.query;
    const where = {};
    const topicWhere = {};

    if (topic_id) where.topic_id = topic_id;
    if (difficulty) where.difficulty = difficulty;
    if (bank) where.bank = bank;
    if (subject_id) topicWhere.subject_id = subject_id;

    const questions = await Question.findAndCountAll({
      where,
      include: [
        { model: Alternative, as: 'alternatives' },
        {
          model: Topic,
          as: 'topic',
          where: Object.keys(topicWhere).length ? topicWhere : undefined,
          include: [{ model: Subject, as: 'subject' }],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['id', 'DESC']],
    });

    return res.json({ message: 'Questions fetched', data: questions });
  } catch (error) {
    console.error('getAll questions error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await Question.findByPk(id, {
      include: [
        { model: Alternative, as: 'alternatives' },
        { model: Topic, as: 'topic', include: [{ model: Subject, as: 'subject' }] },
      ],
    });
    if (!question) return res.status(404).json({ message: 'Question not found' });
    return res.json({ message: 'Question fetched', data: question });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'teacher' && role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { statement, topic_id, difficulty, source, year, bank, alternatives } = req.body;
    const question = await Question.create({
      statement, topic_id, difficulty, source, year, bank, created_by: req.user.id,
    });

    if (alternatives && Array.isArray(alternatives)) {
      for (const alt of alternatives) {
        await Alternative.create({ question_id: question.id, ...alt });
      }
    }

    const full = await Question.findByPk(question.id, {
      include: [{ model: Alternative, as: 'alternatives' }],
    });

    return res.status(201).json({ message: 'Question created', data: full });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'teacher' && role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { id } = req.params;
    const question = await Question.findByPk(id);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    await question.update(req.body);
    return res.json({ message: 'Question updated', data: question });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'teacher' && role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { id } = req.params;
    const question = await Question.findByPk(id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    await question.destroy();
    return res.json({ message: 'Question deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      include: [{ model: Topic, as: 'topics' }],
      order: [['name', 'ASC']],
    });
    return res.json({ message: 'Subjects fetched', data: subjects });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { session_id, question_id, chosen_alternative_id, response_time_seconds } = req.body;
    const student_id = req.user.id;

    const alternative = await Alternative.findByPk(chosen_alternative_id);
    const is_correct = alternative ? alternative.is_correct : false;

    const answer = await Answer.create({
      session_id,
      question_id,
      chosen_alternative_id,
      is_correct,
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
      await streak.update({ current_streak: new_streak, longest_streak: Math.max(new_streak, streak.longest_streak), last_activity_date: today });
    }

    return res.json({ message: 'Answer submitted', data: { answer, is_correct } });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
