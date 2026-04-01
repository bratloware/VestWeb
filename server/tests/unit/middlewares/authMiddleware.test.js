import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ── Mocks (must be declared before dynamic import) ──────────────────────────
const mockVerifyToken = jest.fn();
const mockStudentFindByPk = jest.fn();

jest.unstable_mockModule('../../../src/services/jwtService.js', () => ({
  verifyToken: mockVerifyToken,
  generateToken: jest.fn(),
}));

jest.unstable_mockModule('../../../src/db/models/index.js', () => ({
  Student: { findByPk: mockStudentFindByPk },
  Session: { create: jest.fn(), destroy: jest.fn() },
  Alternative: {},
  Answer: {},
  Badge: {},
  Comment: {},
  FavoriteVideo: {},
  Like: {},
  Mentor: {},
  MentoringSession: {},
  Points: {},
  Post: {},
  Question: {},
  QuestionSession: {},
  Report: {},
  Simulation: {},
  SimulationQuestion: {},
  Streak: {},
  StudentBadge: {},
  StudyEvent: {},
  Subject: {},
  Topic: {},
  Video: {},
  VideoProgress: {},
}));

const { default: authMiddleware } = await import('../../../src/middlewares/authMiddleware.js');

// ── Helpers ──────────────────────────────────────────────────────────────────
const makeReqRes = (authHeader) => {
  const req = { headers: { authorization: authHeader } };
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  return { req, res, next };
};

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('authMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call next() when token is valid and user exists', async () => {
    const fakeStudent = { id: 1, name: 'Ana', role: 'student', toJSON: () => ({ id: 1, name: 'Ana', role: 'student' }) };
    mockVerifyToken.mockReturnValue({ id: 1 });
    mockStudentFindByPk.mockResolvedValue(fakeStudent);

    const { req, res, next } = makeReqRes('Bearer valid.token.here');
    await authMiddleware(req, res, next);

    expect(mockVerifyToken).toHaveBeenCalledWith('valid.token.here');
    expect(mockStudentFindByPk).toHaveBeenCalledWith(1);
    expect(req.user).toEqual({ id: 1, name: 'Ana', role: 'student' });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 401 when Authorization header is missing', async () => {
    const { req, res, next } = makeReqRes(undefined);
    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when header does not start with Bearer', async () => {
    const { req, res, next } = makeReqRes('Basic sometoken');
    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
  });

  it('should return 401 when student is not found in DB', async () => {
    mockVerifyToken.mockReturnValue({ id: 999 });
    mockStudentFindByPk.mockResolvedValue(null);

    const { req, res, next } = makeReqRes('Bearer valid.token.here');
    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token verification throws (expired or tampered)', async () => {
    mockVerifyToken.mockImplementation(() => { throw new Error('jwt expired'); });

    const { req, res, next } = makeReqRes('Bearer expired.token.here');
    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });
});
