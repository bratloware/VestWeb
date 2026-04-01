import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ── Mocks ─────────────────────────────────────────────────────────────────────
const mockMentorFindAll = jest.fn();
const mockMentorFindByPk = jest.fn();
const mockMentoringSessionFindAll = jest.fn();
const mockMentoringSessionFindByPk = jest.fn();
const mockMentoringSessionCreate = jest.fn();

jest.unstable_mockModule('../../../src/db/models/index.js', () => ({
  Mentor: { findAll: mockMentorFindAll, findByPk: mockMentorFindByPk },
  MentoringSession: {
    findAll: mockMentoringSessionFindAll,
    findByPk: mockMentoringSessionFindByPk,
    create: mockMentoringSessionCreate,
  },
  Student: {},
}));

const {
  getMentors, getSessions, bookSession, updateSessionStatus,
} = await import('../../../src/controllers/mentoringController.js');

// ── Helper ────────────────────────────────────────────────────────────────────
const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

// ── getMentors ─────────────────────────────────────────────────────────────────
describe('mentoringController.getMentors', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return all mentors', async () => {
    mockMentorFindAll.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const res = makeRes();
    await getMentors({}, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Mentors fetched', data: expect.any(Array) });
  });
});

// ── getSessions ────────────────────────────────────────────────────────────────
describe('mentoringController.getSessions', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return sessions for the current user only', async () => {
    mockMentoringSessionFindAll.mockResolvedValue([]);
    const req = { user: { id: 7 } };
    const res = makeRes();
    await getSessions(req, res);
    expect(mockMentoringSessionFindAll).toHaveBeenCalledWith(
      expect.objectContaining({ where: { student_id: 7 } }),
    );
  });
});

// ── bookSession ────────────────────────────────────────────────────────────────
describe('mentoringController.bookSession', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 when mentor_id is missing', async () => {
    const req = { body: { scheduled_at: '2025-06-01' }, user: { id: 7 } };
    const res = makeRes();
    await bookSession(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'mentor_id and scheduled_at are required' });
  });

  it('should return 400 when scheduled_at is missing', async () => {
    const req = { body: { mentor_id: 1 }, user: { id: 7 } };
    const res = makeRes();
    await bookSession(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 404 when the mentor does not exist', async () => {
    mockMentorFindByPk.mockResolvedValue(null);
    const req = { body: { mentor_id: 999, scheduled_at: '2025-06-01' }, user: { id: 7 } };
    const res = makeRes();
    await bookSession(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Mentor not found' });
  });

  it('should book a session successfully', async () => {
    mockMentorFindByPk.mockResolvedValue({ id: 1 });
    mockMentoringSessionCreate.mockResolvedValue({ id: 10, mentor_id: 1, student_id: 7 });
    const req = {
      body: { mentor_id: 1, scheduled_at: '2025-06-15T14:00:00Z', notes: 'Need help with bio' },
      user: { id: 7 },
    };
    const res = makeRes();
    await bookSession(req, res);
    expect(mockMentoringSessionCreate).toHaveBeenCalledWith(expect.objectContaining({
      mentor_id: 1, student_id: 7,
    }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: 'Session booked', data: expect.any(Object) });
  });
});

// ── updateSessionStatus ────────────────────────────────────────────────────────
describe('mentoringController.updateSessionStatus', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 404 when session does not exist', async () => {
    mockMentoringSessionFindByPk.mockResolvedValue(null);
    const req = { params: { id: '999' }, body: {}, user: { id: 1, role: 'student' } };
    const res = makeRes();
    await updateSessionStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should return 403 when a non-mentor, non-admin user tries to update', async () => {
    mockMentoringSessionFindByPk.mockResolvedValue({ id: 1, mentor_id: 5 });
    mockMentorFindByPk.mockResolvedValue({ id: 5, student_id: 99 }); // mentor belongs to student 99
    const req = { params: { id: '1' }, body: { status: 'confirmed' }, user: { id: 7, role: 'student' } };
    const res = makeRes();
    await updateSessionStatus(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should update when the requesting user is the mentor', async () => {
    const mockUpdate = jest.fn();
    mockMentoringSessionFindByPk.mockResolvedValue({ id: 1, mentor_id: 5, notes: 'old', update: mockUpdate });
    mockMentorFindByPk.mockResolvedValue({ id: 5, student_id: 7 }); // mentor belongs to student 7
    const req = {
      params: { id: '1' },
      body: { status: 'confirmed' },
      user: { id: 7, role: 'student' },
    };
    const res = makeRes();
    await updateSessionStatus(req, res);
    expect(mockUpdate).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ message: 'Session updated', data: expect.any(Object) });
  });

  it('should allow admin to update any session', async () => {
    const mockUpdate = jest.fn();
    mockMentoringSessionFindByPk.mockResolvedValue({ id: 1, mentor_id: 5, notes: '', update: mockUpdate });
    mockMentorFindByPk.mockResolvedValue({ id: 5, student_id: 99 });
    const req = {
      params: { id: '1' },
      body: { status: 'cancelled' },
      user: { id: 1, role: 'admin' },
    };
    const res = makeRes();
    await updateSessionStatus(req, res);
    expect(mockUpdate).toHaveBeenCalled();
  });
});
