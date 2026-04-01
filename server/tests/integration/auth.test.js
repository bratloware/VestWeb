/**
 * Integration tests for /api/auth routes.
 *
 * Strategy: mock the DB models and services so no real database is required.
 * supertest is used to exercise the full Express middleware stack (body
 * parsing, routing, error handlers) on top of the mocked dependencies.
 */
import { jest, describe, it, expect, beforeEach, afterAll } from '@jest/globals';

// ── Mocks (must come before any import that loads models) ─────────────────────
const mockStudentFindOne = jest.fn();
const mockStudentFindByPk = jest.fn();
const mockSessionCreate = jest.fn();
const mockSessionDestroy = jest.fn();
const mockGenerateToken = jest.fn(() => 'integration_jwt_token');
const mockVerifyToken = jest.fn();
const mockComparePassword = jest.fn();

// All models must be listed — app.js loads every route/controller on import
jest.unstable_mockModule('../../src/db/models/index.js', () => ({
  Student: { findOne: mockStudentFindOne, findByPk: mockStudentFindByPk },
  Session: { create: mockSessionCreate, destroy: mockSessionDestroy },
  Alternative: { findByPk: jest.fn(), create: jest.fn() },
  Answer: { create: jest.fn() },
  Badge: {},
  Banner: {},
  Comment: { findAll: jest.fn(), create: jest.fn(), findByPk: jest.fn() },
  FavoriteVideo: { findOne: jest.fn(), create: jest.fn(), findAll: jest.fn() },
  InstitutionalVideo: {},
  Like: { findOne: jest.fn(), create: jest.fn() },
  Mentor: { findAll: jest.fn(), findByPk: jest.fn() },
  MentoringSession: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Points: { create: jest.fn(), findAll: jest.fn() },
  Post: { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  Question: { findAndCountAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  QuestionSession: { create: jest.fn(), findByPk: jest.fn(), findAll: jest.fn() },
  Report: { create: jest.fn() },
  Simulation: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  SimulationQuestion: { create: jest.fn() },
  Streak: {},
  StudentBadge: {},
  StudyEvent: { findAll: jest.fn(), create: jest.fn(), findByPk: jest.fn(), destroy: jest.fn() },
  Subject: { findAll: jest.fn() },
  Testimonial: {},
  Topic: {},
  Video: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  VideoProgress: { findOne: jest.fn(), findOrCreate: jest.fn() },
}));

jest.unstable_mockModule('../../src/services/jwtService.js', () => ({
  generateToken: mockGenerateToken,
  verifyToken: mockVerifyToken,
}));

jest.unstable_mockModule('../../src/services/hashService.js', () => ({
  comparePassword: mockComparePassword,
  hashPassword: jest.fn(),
}));

jest.unstable_mockModule('../../src/db/index.js', () => ({ default: { authenticate: jest.fn(), sync: jest.fn() } }));

// Dynamic import AFTER mocks are set up
const { default: supertest } = await import('supertest');
const { default: app } = await import('../../app.js');
const request = supertest(app);

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeStudent = (overrides = {}) => ({
  id: 1,
  name: 'Ana Lima',
  enrollment: 'ANA001',
  password_hash: 'hashed_pw',
  role: 'student',
  toJSON() { return { id: this.id, name: this.name, enrollment: this.enrollment, role: this.role }; },
  ...overrides,
});

// ── POST /api/auth/login ───────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — returns token on valid student credentials', async () => {
    mockStudentFindOne.mockResolvedValue(makeStudent());
    mockComparePassword.mockResolvedValue(true);
    mockSessionCreate.mockResolvedValue({});

    const res = await request
      .post('/api/auth/login')
      .send({ enrollment: 'ANA001', password: 'correctpassword' });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token', 'integration_jwt_token');
    expect(res.body.data.student).toHaveProperty('enrollment', 'ANA001');
  });

  it('400 — missing fields', async () => {
    const res = await request.post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('401 — student not found', async () => {
    mockStudentFindOne.mockResolvedValue(null);
    const res = await request.post('/api/auth/login').send({ enrollment: 'FAKE', password: 'pw' });
    expect(res.status).toBe(401);
  });

  it('401 — wrong password', async () => {
    mockStudentFindOne.mockResolvedValue(makeStudent());
    mockComparePassword.mockResolvedValue(false);
    const res = await request.post('/api/auth/login').send({ enrollment: 'ANA001', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('403 — teacher using student login route', async () => {
    mockStudentFindOne.mockResolvedValue(makeStudent({ role: 'teacher' }));
    mockComparePassword.mockResolvedValue(true);
    const res = await request
      .post('/api/auth/login')
      .send({ enrollment: 'PROF001', password: 'correct' });
    expect(res.status).toBe(403);
  });
});

// ── POST /api/auth/teacher-login ──────────────────────────────────────────────
describe('POST /api/auth/teacher-login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — returns token for a valid teacher', async () => {
    mockStudentFindOne.mockResolvedValue(makeStudent({ role: 'teacher', enrollment: 'PROF001' }));
    mockComparePassword.mockResolvedValue(true);
    mockSessionCreate.mockResolvedValue({});
    const res = await request
      .post('/api/auth/teacher-login')
      .send({ enrollment: 'PROF001', password: 'correct' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
  });

  it('403 — student using teacher login route', async () => {
    mockStudentFindOne.mockResolvedValue(makeStudent({ role: 'student' }));
    mockComparePassword.mockResolvedValue(true);
    const res = await request
      .post('/api/auth/teacher-login')
      .send({ enrollment: 'ANA001', password: 'correct' });
    expect(res.status).toBe(403);
  });
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — returns user for valid token', async () => {
    const student = makeStudent();
    mockVerifyToken.mockReturnValue({ id: 1 });
    mockStudentFindByPk.mockResolvedValue(student);

    const res = await request
      .get('/api/auth/me')
      .set('Authorization', 'Bearer valid.token.here');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id', 1);
  });

  it('401 — no token provided', async () => {
    const res = await request.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('401 — expired or invalid token', async () => {
    mockVerifyToken.mockImplementation(() => { throw new Error('jwt expired'); });
    const res = await request
      .get('/api/auth/me')
      .set('Authorization', 'Bearer expired.token');
    expect(res.status).toBe(401);
  });
});

// ── POST /api/auth/logout ──────────────────────────────────────────────────────
describe('POST /api/auth/logout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('200 — clears session and returns success', async () => {
    const student = makeStudent();
    mockVerifyToken.mockReturnValue({ id: 1 });
    mockStudentFindByPk.mockResolvedValue(student);
    mockSessionDestroy.mockResolvedValue(1);

    const res = await request
      .post('/api/auth/logout')
      .set('Authorization', 'Bearer some.token.here');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });
});

afterAll(() => {
  // Nothing to tear down (no real server/DB started)
});
