import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockAnswerCreate = jest.fn();
const mockPointsCreate = jest.fn();
const mockStreakFindOne = jest.fn();
const mockStreakCreate = jest.fn();
const mockAlternativeFindOne = jest.fn();
const mockQuestionSessionFindOne = jest.fn();
const mockQuestionFindByPk = jest.fn();
const mockSequelizeQuery = jest.fn();
const mockSequelizeTransaction = jest.fn();

jest.unstable_mockModule('../../../src/db/models/index.js', () => ({
  Answer: { create: mockAnswerCreate },
  Points: { create: mockPointsCreate },
  Streak: { findOne: mockStreakFindOne, create: mockStreakCreate },
  Question: { findByPk: mockQuestionFindByPk },
  Alternative: { findOne: mockAlternativeFindOne },
  QuestionSession: { findOne: mockQuestionSessionFindOne, create: jest.fn() },
  Student: { findByPk: jest.fn() },
  Vestibular: { findByPk: jest.fn() },
}));

jest.unstable_mockModule('../../../src/db/index.js', () => ({
  default: {
    query: mockSequelizeQuery,
    transaction: mockSequelizeTransaction,
  },
}));

const { submitAnswer } = await import('../../../src/controllers/questionsController.js');

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe('questionsController.submitAnswer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSequelizeTransaction.mockResolvedValue({
      commit: jest.fn(),
      rollback: jest.fn(),
    });
  });

  it('returns 400 when required ids are missing/invalid', async () => {
    const req = {
      user: { id: 10 },
      body: { session_id: 'x', question_id: 2, chosen_alternative_id: 3 },
    };
    const res = makeRes();

    await submitAnswer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockSequelizeTransaction).not.toHaveBeenCalled();
  });

  it('returns 400 when response_time_seconds is invalid', async () => {
    const req = {
      user: { id: 10 },
      body: { session_id: 1, question_id: 2, chosen_alternative_id: 3, response_time_seconds: 'abc' },
    };
    const res = makeRes();

    await submitAnswer(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockSequelizeTransaction).not.toHaveBeenCalled();
  });

  it('returns 403 when session does not belong to authenticated user', async () => {
    const tx = { commit: jest.fn(), rollback: jest.fn() };
    mockSequelizeTransaction.mockResolvedValue(tx);
    mockQuestionSessionFindOne.mockResolvedValue(null);

    const req = {
      user: { id: 10 },
      body: { session_id: 11, question_id: 2, chosen_alternative_id: 3, response_time_seconds: 12 },
    };
    const res = makeRes();

    await submitAnswer(req, res);

    expect(mockQuestionSessionFindOne).toHaveBeenCalledWith({
      where: { id: 11, student_id: 10 },
      transaction: tx,
    });
    expect(tx.rollback).toHaveBeenCalledTimes(1);
    expect(tx.commit).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 400 when alternative does not belong to informed question', async () => {
    const tx = { commit: jest.fn(), rollback: jest.fn() };
    mockSequelizeTransaction.mockResolvedValue(tx);
    mockQuestionSessionFindOne.mockResolvedValue({ id: 11, student_id: 10 });
    mockAlternativeFindOne.mockResolvedValue(null);

    const req = {
      user: { id: 10 },
      body: { session_id: 11, question_id: 2, chosen_alternative_id: 999 },
    };
    const res = makeRes();

    await submitAnswer(req, res);

    expect(mockAlternativeFindOne).toHaveBeenCalledWith({
      where: { id: 999, question_id: 2 },
      attributes: ['id', 'is_correct'],
      transaction: tx,
    });
    expect(tx.rollback).toHaveBeenCalledTimes(1);
    expect(tx.commit).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('creates answer, points and streak in a single transaction for correct answer', async () => {
    const tx = { commit: jest.fn(), rollback: jest.fn() };
    mockSequelizeTransaction.mockResolvedValue(tx);
    mockQuestionSessionFindOne.mockResolvedValue({ id: 11, student_id: 10 });
    mockAlternativeFindOne.mockResolvedValue({ id: 5, is_correct: true });
    mockAnswerCreate.mockResolvedValue({ id: 100, is_correct: true });
    mockStreakFindOne.mockResolvedValue(null);

    const req = {
      user: { id: 10 },
      body: { session_id: 11, question_id: 2, chosen_alternative_id: 5, response_time_seconds: '12' },
    };
    const res = makeRes();

    await submitAnswer(req, res);

    expect(mockAnswerCreate).toHaveBeenCalledWith(expect.objectContaining({
      session_id: 11,
      question_id: 2,
      chosen_alternative_id: 5,
      is_correct: true,
      student_id: 10,
      response_time_seconds: 12,
    }), { transaction: tx });
    expect(mockPointsCreate).toHaveBeenCalledWith(
      { student_id: 10, amount: 10, reason: 'correct_answer' },
      { transaction: tx },
    );
    expect(mockStreakCreate).toHaveBeenCalledWith(expect.objectContaining({
      student_id: 10,
      current_streak: 1,
      longest_streak: 1,
    }), { transaction: tx });
    expect(tx.commit).toHaveBeenCalledTimes(1);
    expect(tx.rollback).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Answer submitted',
      data: expect.objectContaining({ is_correct: true }),
    }));
  });

  it('does not create points when answer is wrong', async () => {
    const tx = { commit: jest.fn(), rollback: jest.fn() };
    const today = new Date().toISOString().slice(0, 10);
    mockSequelizeTransaction.mockResolvedValue(tx);
    mockQuestionSessionFindOne.mockResolvedValue({ id: 11, student_id: 10 });
    mockAlternativeFindOne.mockResolvedValue({ id: 6, is_correct: false });
    mockAnswerCreate.mockResolvedValue({ id: 101, is_correct: false });
    mockStreakFindOne.mockResolvedValue({
      student_id: 10,
      last_activity_date: today,
      current_streak: 3,
      longest_streak: 5,
      update: jest.fn(),
    });

    const req = {
      user: { id: 10 },
      body: { session_id: 11, question_id: 2, chosen_alternative_id: 6 },
    };
    const res = makeRes();

    await submitAnswer(req, res);

    expect(mockPointsCreate).not.toHaveBeenCalled();
    expect(tx.commit).toHaveBeenCalledTimes(1);
    expect(tx.rollback).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ is_correct: false }),
    }));
  });
});
