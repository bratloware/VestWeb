import { describe, it, expect, jest } from '@jest/globals';
import requireTeacher from '../../../src/middlewares/requireTeacher.js';

const makeRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
});

describe('requireTeacher middleware', () => {
  it('allows users with type teacher', () => {
    const req = { user: { id: 1, type: 'teacher' } };
    const res = makeRes();
    const next = jest.fn();

    requireTeacher(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows users with teacher role', () => {
    const req = { user: { id: 2, role: 'teacher', type: 'student' } };
    const res = makeRes();
    const next = jest.fn();

    requireTeacher(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('allows users with admin role', () => {
    const req = { user: { id: 3, role: 'admin', type: 'student' } };
    const res = makeRes();
    const next = jest.fn();

    requireTeacher(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('blocks users without teacher/admin permission', () => {
    const req = { user: { id: 4, role: 'student', type: 'student' } };
    const res = makeRes();
    const next = jest.fn();

    requireTeacher(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Acesso restrito a professores' });
  });
});
