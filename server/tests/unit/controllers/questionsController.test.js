import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockQuestionFindAndCountAll = jest.fn();
const mockQuestionFindByPk = jest.fn();
const mockQuestionCreate = jest.fn();
const mockAlternativeFindByPk = jest.fn();
const mockAlternativeCreate = jest.fn();
const mockAnswerCreate = jest.fn();
const mockSubjectFindAll = jest.fn();

jest.unstable_mockModule('../../../src/db/models/index.js', () => ({
  Question: {
    findAndCountAll: mockQuestionFindAndCountAll,
    findByPk: mockQuestionFindByPk,
    create: mockQuestionCreate,
  },
  Alternative: {
    findByPk: mockAlternativeFindByPk,
    create: mockAlternativeCreate,
  },
  Answer: { create: mockAnswerCreate },
  Topic: {},
  Subject: { findAll: mockSubjectFindAll },
  QuestionSession: {},
}));

const {
  getAll, getById, create, update, remove, getSubjects, submitAnswer,
} = await import('../../../src/controllers/questionsController.js');

// ── Helper ────────────────────────────────────────────────────────────────────
const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const makeQuestion = (id = 1) => ({
  id,
  statement: 'What is 2+2?',
  topic_id: 1,
  difficulty: 'easy',
  update: jest.fn(),
  destroy: jest.fn(),
  toJSON() { return { id: this.id, statement: this.statement }; },
});

// ── getAll ─────────────────────────────────────────────────────────────────────
describe('questionsController.getAll', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return paginated questions', async () => {
    mockQuestionFindAndCountAll.mockResolvedValue({ count: 1, rows: [makeQuestion()] });
    const req = { query: {} };
    const res = makeRes();
    await getAll(req, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Questions fetched', data: expect.any(Object) });
  });

  it('should apply subject_id filter via topicWhere', async () => {
    mockQuestionFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    const req = { query: { subject_id: '5', difficulty: 'hard', bank: 'FUVEST' } };
    const res = makeRes();
    await getAll(req, res);
    const [callArgs] = mockQuestionFindAndCountAll.mock.calls;
    expect(callArgs[0].where.difficulty).toBe('hard');
    expect(callArgs[0].where.bank).toBe('FUVEST');
  });

  it('should use default limit=10 and offset=0', async () => {
    mockQuestionFindAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    const req = { query: {} };
    const res = makeRes();
    await getAll(req, res);
    const [callArgs] = mockQuestionFindAndCountAll.mock.calls;
    expect(callArgs[0].limit).toBe(10);
    expect(callArgs[0].offset).toBe(0);
  });
});

// ── getById ────────────────────────────────────────────────────────────────────
describe('questionsController.getById', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return the question when found', async () => {
    mockQuestionFindByPk.mockResolvedValue(makeQuestion());
    const req = { params: { id: '1' } };
    const res = makeRes();
    await getById(req, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Question fetched', data: expect.any(Object) });
  });

  it('should return 404 when question is not found', async () => {
    mockQuestionFindByPk.mockResolvedValue(null);
    const req = { params: { id: '999' } };
    const res = makeRes();
    await getById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Question not found' });
  });
});

// ── create ─────────────────────────────────────────────────────────────────────
describe('questionsController.create', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 403 when a student tries to create a question', async () => {
    const req = { user: { id: 1, role: 'student' }, body: {} };
    const res = makeRes();
    await create(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
  });

  it('should create question and alternatives for a teacher', async () => {
    const created = { id: 10, ...makeQuestion(10) };
    mockQuestionCreate.mockResolvedValue(created);
    mockAlternativeCreate.mockResolvedValue({});
    mockQuestionFindByPk.mockResolvedValue(created);

    const req = {
      user: { id: 2, role: 'teacher' },
      body: {
        statement: 'What is 2+2?', topic_id: 1, difficulty: 'easy',
        alternatives: [
          { letter: 'A', text: '3', is_correct: false },
          { letter: 'B', text: '4', is_correct: true },
        ],
      },
    };
    const res = makeRes();
    await create(req, res);
    expect(mockQuestionCreate).toHaveBeenCalled();
    expect(mockAlternativeCreate).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should allow admin to create a question', async () => {
    const created = makeQuestion(11);
    mockQuestionCreate.mockResolvedValue(created);
    mockQuestionFindByPk.mockResolvedValue(created);
    const req = { user: { id: 3, role: 'admin' }, body: { statement: 'Q', topic_id: 1 } };
    const res = makeRes();
    await create(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

// ── remove ─────────────────────────────────────────────────────────────────────
describe('questionsController.remove', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 403 for a student', async () => {
    const req = { user: { role: 'student' }, params: { id: '1' } };
    const res = makeRes();
    await remove(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should return 404 when question does not exist', async () => {
    mockQuestionFindByPk.mockResolvedValue(null);
    const req = { user: { role: 'teacher' }, params: { id: '999' } };
    const res = makeRes();
    await remove(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should delete the question and return a success message', async () => {
    const q = makeQuestion();
    mockQuestionFindByPk.mockResolvedValue(q);
    const req = { user: { role: 'teacher' }, params: { id: '1' } };
    const res = makeRes();
    await remove(req, res);
    expect(q.destroy).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Question deleted' });
  });
});

// ── submitAnswer ───────────────────────────────────────────────────────────────
describe('questionsController.submitAnswer', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create an answer with is_correct=true for the correct alternative', async () => {
    mockAlternativeFindByPk.mockResolvedValue({ id: 5, is_correct: true });
    mockAnswerCreate.mockResolvedValue({ id: 1, is_correct: true });

    const req = {
      body: { session_id: 1, question_id: 2, chosen_alternative_id: 5, response_time_seconds: 12 },
    };
    const res = makeRes();
    await submitAnswer(req, res);
    expect(mockAnswerCreate).toHaveBeenCalledWith(expect.objectContaining({ is_correct: true }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ is_correct: true }),
    }));
  });

  it('should create an answer with is_correct=false for a wrong alternative', async () => {
    mockAlternativeFindByPk.mockResolvedValue({ id: 6, is_correct: false });
    mockAnswerCreate.mockResolvedValue({ id: 2, is_correct: false });

    const req = {
      body: { session_id: 1, question_id: 2, chosen_alternative_id: 6 },
    };
    const res = makeRes();
    await submitAnswer(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ is_correct: false }),
    }));
  });

  it('should set is_correct=false when alternative is not found', async () => {
    mockAlternativeFindByPk.mockResolvedValue(null);
    mockAnswerCreate.mockResolvedValue({ id: 3, is_correct: false });

    const req = { body: { session_id: 1, question_id: 2, chosen_alternative_id: 999 } };
    const res = makeRes();
    await submitAnswer(req, res);
    expect(mockAnswerCreate).toHaveBeenCalledWith(expect.objectContaining({ is_correct: false }));
  });
});
