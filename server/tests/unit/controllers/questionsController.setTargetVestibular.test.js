import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockStudentFindByPk = jest.fn();
const mockVestibularFindByPk = jest.fn();
const mockSequelizeQuery = jest.fn();
const mockSequelizeTransaction = jest.fn();

jest.unstable_mockModule('../../../src/db/models/index.js', () => ({
  Answer: { create: jest.fn() },
  Points: { create: jest.fn() },
  Streak: { findOne: jest.fn(), create: jest.fn() },
  Question: { findByPk: jest.fn() },
  Alternative: { findOne: jest.fn() },
  QuestionSession: { findOne: jest.fn(), create: jest.fn() },
  Student: { findByPk: mockStudentFindByPk },
  Vestibular: { findByPk: mockVestibularFindByPk },
}));

jest.unstable_mockModule('../../../src/db/index.js', () => ({
  default: {
    query: mockSequelizeQuery,
    transaction: mockSequelizeTransaction,
  },
}));

const { setTargetVestibular } = await import('../../../src/controllers/questionsController.js');

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe('questionsController.setTargetVestibular', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 for teacher users', async () => {
    const req = {
      user: { id: 1, type: 'teacher' },
      body: { vestibular_id: 5 },
    };
    const res = makeRes();

    await setTargetVestibular(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockStudentFindByPk).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid vestibular_id', async () => {
    const req = {
      user: { id: 2, type: 'student' },
      body: { vestibular_id: 'abc' },
    };
    const res = makeRes();

    await setTargetVestibular(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockVestibularFindByPk).not.toHaveBeenCalled();
    expect(mockStudentFindByPk).not.toHaveBeenCalled();
  });

  it('returns 404 when vestibular does not exist', async () => {
    mockVestibularFindByPk.mockResolvedValue(null);
    const req = {
      user: { id: 2, type: 'student' },
      body: { vestibular_id: 9999 },
    };
    const res = makeRes();

    await setTargetVestibular(req, res);

    expect(mockVestibularFindByPk).toHaveBeenCalledWith(9999);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockStudentFindByPk).not.toHaveBeenCalled();
  });

  it('returns 404 when student is not found', async () => {
    mockVestibularFindByPk.mockResolvedValue({ id: 7 });
    mockStudentFindByPk.mockResolvedValue(null);
    const req = {
      user: { id: 2, type: 'student' },
      body: { vestibular_id: 7 },
    };
    const res = makeRes();

    await setTargetVestibular(req, res);

    expect(mockStudentFindByPk).toHaveBeenCalledWith(2);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('updates student target vestibular when id is valid', async () => {
    const mockUpdate = jest.fn();
    mockVestibularFindByPk.mockResolvedValue({ id: 7 });
    mockStudentFindByPk.mockResolvedValue({ id: 2, update: mockUpdate });
    const req = {
      user: { id: 2, type: 'student' },
      body: { vestibular_id: 7 },
    };
    const res = makeRes();

    await setTargetVestibular(req, res);

    expect(mockUpdate).toHaveBeenCalledWith({ target_vestibular_id: 7 });
    expect(res.json).toHaveBeenCalledWith({
      message: 'Target vestibular updated',
      data: { target_vestibular_id: 7 },
    });
  });

  it('allows clearing target vestibular with null', async () => {
    const mockUpdate = jest.fn();
    mockStudentFindByPk.mockResolvedValue({ id: 2, update: mockUpdate });
    const req = {
      user: { id: 2, type: 'student' },
      body: { vestibular_id: null },
    };
    const res = makeRes();

    await setTargetVestibular(req, res);

    expect(mockVestibularFindByPk).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith({ target_vestibular_id: null });
    expect(res.json).toHaveBeenCalledWith({
      message: 'Target vestibular updated',
      data: { target_vestibular_id: null },
    });
  });
});
