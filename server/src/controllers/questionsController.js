import { Question, Alternative, Topic, Subtopic, Subject, Vestibular, QuestionVestibular, Answer, QuestionSession, Points, Streak } from '../db/models/index.js';
import sequelize from '../db/index.js';

export const getAll = async (req, res) => {
  try {
    const { subject_id, topic_id, subtopic_id, difficulty, bank, vestibular_id, limit = 100, offset = 0 } = req.query;
    const where = {};
    const topicWhere = {};

    if (topic_id) where.topic_id = topic_id;
    if (subtopic_id) where.subtopic_id = subtopic_id;
    if (difficulty) where.difficulty = difficulty;
    if (bank) where.bank = bank;
    if (subject_id) topicWhere.subject_id = subject_id;
    // Se vestibular_id for passado, filtra questões daquele vestibular
    const vestibularInclude = vestibular_id
      ? { model: Vestibular, as: 'vestibulares', through: { attributes: [] }, where: { id: vestibular_id }, required: true }
      : { model: Vestibular, as: 'vestibulares', through: { attributes: [] }, required: false };

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
        { model: Subtopic, as: 'subtopic', required: false },
        vestibularInclude,
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [sequelize.random()],
      distinct: true,
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
        {
          model: Topic, as: 'topic',
          include: [{ model: Subject, as: 'subject' }],
        },
        { model: Subtopic, as: 'subtopic', required: false },
        { model: Vestibular, as: 'vestibulares', through: { attributes: [] } },
      ],
      order: [[{ model: Alternative, as: 'alternatives' }, 'letter', 'ASC']],
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

    const { statement, topic_id, subtopic_id, difficulty, source, year, bank, image, alternatives, vestibular_ids } = req.body;
    const question = await Question.create({
      statement, topic_id, subtopic_id, difficulty, source, year, bank, image: image || null, created_by: req.user.id,
    });

    if (alternatives && Array.isArray(alternatives)) {
      for (const alt of alternatives) {
        await Alternative.create({ question_id: question.id, ...alt });
      }
    }

    if (vestibular_ids && Array.isArray(vestibular_ids)) {
      for (const vestibular_id of vestibular_ids) {
        await QuestionVestibular.create({ question_id: question.id, vestibular_id });
      }
    }

    const full = await Question.findByPk(question.id, {
      include: [
        { model: Alternative, as: 'alternatives' },
        { model: Vestibular, as: 'vestibulares', through: { attributes: [] } },
      ],
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

    const { vestibular_ids, alternatives, ...fields } = req.body;
    await question.update(fields);

    if (alternatives && Array.isArray(alternatives)) {
      for (const alt of alternatives) {
        if (alt.id) {
          await Alternative.update(
            { text: alt.text, image: alt.image ?? null },
            { where: { id: alt.id, question_id: id } },
          );
        }
      }
    }

    if (vestibular_ids && Array.isArray(vestibular_ids)) {
      await QuestionVestibular.destroy({ where: { question_id: id } });
      for (const vestibular_id of vestibular_ids) {
        await QuestionVestibular.create({ question_id: id, vestibular_id });
      }
    }

    const updated = await Question.findByPk(id, {
      include: [{ model: Alternative, as: 'alternatives' }],
    });
    return res.json({ message: 'Question updated', data: updated });
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
    // Retorna apenas matérias que possuem ao menos uma questão
    const subjects = await Subject.findAll({
      include: [{
        model: Topic,
        as: 'topics',
        required: true,
        include: [{ model: Subtopic, as: 'subtopics' }],
        where: sequelize.literal(
          `EXISTS (SELECT 1 FROM questions q WHERE q.topic_id = "topics"."id")`
        ),
      }],
      order: [['name', 'ASC']],
    });
    return res.json({ message: 'Subjects fetched', data: subjects });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getVestibulares = async (req, res) => {
  try {
    const vestibulares = await Vestibular.findAll({ order: [['name', 'ASC']] });
    return res.json({ message: 'Vestibulares fetched', data: vestibulares });
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

    await Question.increment(
      is_correct ? { attempt_count: 1, correct_count: 1 } : { attempt_count: 1 },
      { where: { id: question_id } }
    );

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
