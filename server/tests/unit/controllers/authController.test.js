import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ── Mocks ────────────────────────────────────────────────────────────────────
const mockStudentFindOne = jest.fn();
const mockStudentFindByPk = jest.fn();
const mockSessionCreate = jest.fn();
const mockSessionDestroy = jest.fn();
const mockGenerateToken = jest.fn(() => 'mocked_jwt_token');
const mockComparePassword = jest.fn();

jest.unstable_mockModule('../../../src/db/models/index.js', () => ({
  Student: { findOne: mockStudentFindOne, findByPk: mockStudentFindByPk },
  Session: { create: mockSessionCreate, destroy: mockSessionDestroy },
}));

jest.unstable_mockModule('../../../src/services/jwtService.js', () => ({
  generateToken: mockGenerateToken,
  verifyToken: jest.fn(),
}));

jest.unstable_mockModule('../../../src/services/hashService.js', () => ({
  comparePassword: mockComparePassword,
  hashPassword: jest.fn(),
}));

const { login, teacherLogin, me, logout } = await import('../../../src/controllers/authController.js');

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

const makeStudent = (overrides = {}) => ({
  id: 1,
  name: 'Ana Lima',
  enrollment: 'ANA001',
  password_hash: 'hashed_pw',
  role: 'student',
  toJSON() { return { id: this.id, name: this.name, enrollment: this.enrollment, role: this.role }; },
  ...overrides,
});

// ── login ─────────────────────────────────────────────────────────────────────
describe('authController.login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 when enrollment or password is missing', async () => {
    const req = { body: { enrollment: '', password: '' } };
    const res = makeRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Enrollment and password are required' });
  });

  it('should return 401 when student is not found', async () => {
    mockStudentFindOne.mockResolvedValue(null);
    const req = { body: { enrollment: 'UNKNOWN', password: '123' } };
    const res = makeRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Matrícula ou senha inválidos' });
  });

  it('should return 401 when password does not match', async () => {
    mockStudentFindOne.mockResolvedValue(makeStudent());
    mockComparePassword.mockResolvedValue(false);
    const req = { body: { enrollment: 'ANA001', password: 'wrong' } };
    const res = makeRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Matrícula ou senha inválidos' });
  });

  it('should return 403 when a teacher tries to log in via student route', async () => {
    mockStudentFindOne.mockResolvedValue(makeStudent({ role: 'teacher' }));
    mockComparePassword.mockResolvedValue(true);
    const req = { body: { enrollment: 'PROF001', password: 'correct' } };
    const res = makeRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Professores devem acessar pelo Portal do Professor' });
  });

  it('should return token and student data on successful login', async () => {
    const student = makeStudent();
    mockStudentFindOne.mockResolvedValue(student);
    mockComparePassword.mockResolvedValue(true);
    mockSessionCreate.mockResolvedValue({});
    const req = { body: { enrollment: 'ANA001', password: 'correct' } };
    const res = makeRes();
    await login(req, res);
    expect(mockGenerateToken).toHaveBeenCalledWith({ id: 1, role: 'student' });
    expect(mockSessionCreate).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Login successful',
      data: expect.objectContaining({ token: 'mocked_jwt_token' }),
    }));
  });

  it('should return 500 on unexpected DB error', async () => {
    mockStudentFindOne.mockRejectedValue(new Error('DB crashed'));
    const req = { body: { enrollment: 'ANA001', password: '123' } };
    const res = makeRes();
    await login(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── teacherLogin ──────────────────────────────────────────────────────────────
describe('authController.teacherLogin', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 403 when a student tries to log in via teacher route', async () => {
    mockStudentFindOne.mockResolvedValue(makeStudent({ role: 'student' }));
    mockComparePassword.mockResolvedValue(true);
    const req = { body: { enrollment: 'ANA001', password: 'correct' } };
    const res = makeRes();
    await teacherLogin(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Acesso restrito a professores' });
  });

  it('should succeed for a teacher role', async () => {
    const teacher = makeStudent({ role: 'teacher', enrollment: 'PROF001' });
    mockStudentFindOne.mockResolvedValue(teacher);
    mockComparePassword.mockResolvedValue(true);
    mockSessionCreate.mockResolvedValue({});
    const req = { body: { enrollment: 'PROF001', password: 'correct' } };
    const res = makeRes();
    await teacherLogin(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Login successful' }));
  });

  it('should succeed for an admin role', async () => {
    const admin = makeStudent({ role: 'admin', enrollment: 'ADM001' });
    mockStudentFindOne.mockResolvedValue(admin);
    mockComparePassword.mockResolvedValue(true);
    mockSessionCreate.mockResolvedValue({});
    const req = { body: { enrollment: 'ADM001', password: 'correct' } };
    const res = makeRes();
    await teacherLogin(req, res);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Login successful' }));
  });
});

// ── me ────────────────────────────────────────────────────────────────────────
describe('authController.me', () => {
  it('should return user data from req.user', async () => {
    const req = { user: { id: 1, name: 'Ana', role: 'student' } };
    const res = makeRes();
    await me(req, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'User data', data: req.user });
  });
});

// ── logout ─────────────────────────────────────────────────────────────────────
describe('authController.logout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should destroy the session token and return success message', async () => {
    mockSessionDestroy.mockResolvedValue(1);
    const req = { headers: { authorization: 'Bearer some.token.here' } };
    const res = makeRes();
    await logout(req, res);
    expect(mockSessionDestroy).toHaveBeenCalledWith({ where: { token: 'some.token.here' } });
    expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
  });

  it('should still return success when no Authorization header is present', async () => {
    const req = { headers: {} };
    const res = makeRes();
    await logout(req, res);
    expect(mockSessionDestroy).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
  });
});
