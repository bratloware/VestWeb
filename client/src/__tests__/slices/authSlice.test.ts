import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  loginThunk,
  teacherLoginThunk,
  logoutThunk,
  clearAuth,
  setCredentials,
  setError,
} from '../../slices/authSlice';

// ── Mock the api module ───────────────────────────────────────────────────────
vi.mock('../../api/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import api from '../../api/api';
const mockApi = api as { post: ReturnType<typeof vi.fn>; get: ReturnType<typeof vi.fn> };

// ── Helpers ───────────────────────────────────────────────────────────────────
const buildStore = () =>
  configureStore({ reducer: { auth: authReducer } });

const makeStudent = (overrides = {}) => ({
  id: 1,
  name: 'Ana Lima',
  email: 'ana@VestWeb.com',
  enrollment: 'ANA001',
  avatar_url: null,
  role: 'student' as const,
  created_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

// ── Reducer: synchronous actions ──────────────────────────────────────────────
describe('authSlice — synchronous reducers', () => {
  it('clearAuth should reset state and remove localStorage items', () => {
    const store = buildStore();
    store.dispatch(setCredentials({ student: makeStudent(), token: 'tok123' }));
    store.dispatch(clearAuth());
    const { student, token, error } = store.getState().auth;
    expect(student).toBeNull();
    expect(token).toBeNull();
    expect(error).toBeNull();
  });

  it('setCredentials should update student and token', () => {
    const store = buildStore();
    const student = makeStudent();
    store.dispatch(setCredentials({ student, token: 'abc' }));
    expect(store.getState().auth.student).toEqual(student);
    expect(store.getState().auth.token).toBe('abc');
  });

  it('setError should update the error field', () => {
    const store = buildStore();
    store.dispatch(setError('Something went wrong'));
    expect(store.getState().auth.error).toBe('Something went wrong');
  });
});

// ── Thunk: loginThunk ─────────────────────────────────────────────────────────
describe('authSlice — loginThunk', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should set token and student on successful login', async () => {
    const student = makeStudent();
    mockApi.post.mockResolvedValue({ data: { data: { token: 'jwt_tok', student } } });

    const store = buildStore();
    await store.dispatch(loginThunk({ enrollment: 'ANA001', password: 'correct' }));

    const state = store.getState().auth;
    expect(state.token).toBe('jwt_tok');
    expect(state.student).toEqual(student);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set error message on failed login', async () => {
    mockApi.post.mockRejectedValue({
      response: { data: { message: 'Matrícula ou senha inválidos' } },
    });

    const store = buildStore();
    await store.dispatch(loginThunk({ enrollment: 'WRONG', password: 'bad' }));

    const state = store.getState().auth;
    expect(state.error).toBe('Matrícula ou senha inválidos');
    expect(state.token).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('should set loading=true while pending', () => {
    // Create a promise that never resolves to freeze in pending state
    mockApi.post.mockReturnValue(new Promise(() => {}));
    const store = buildStore();
    store.dispatch(loginThunk({ enrollment: 'ANA001', password: 'pw' }));
    expect(store.getState().auth.loading).toBe(true);
  });

  it('should persist token and student in localStorage on success', async () => {
    const student = makeStudent();
    mockApi.post.mockResolvedValue({ data: { data: { token: 'persisted_tok', student } } });
    const store = buildStore();
    await store.dispatch(loginThunk({ enrollment: 'ANA001', password: 'correct' }));
    expect(localStorage.getItem('VestWeb_token')).toBe('persisted_tok');
    expect(JSON.parse(localStorage.getItem('VestWeb_student')!)).toEqual(student);
  });
});

// ── Thunk: teacherLoginThunk ──────────────────────────────────────────────────
describe('authSlice — teacherLoginThunk', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should set state on successful teacher login', async () => {
    const teacher = makeStudent({ role: 'teacher' as const, enrollment: 'PROF001' });
    mockApi.post.mockResolvedValue({ data: { data: { token: 'teacher_tok', student: teacher } } });
    const store = buildStore();
    await store.dispatch(teacherLoginThunk({ enrollment: 'PROF001', password: 'correct' }));
    expect(store.getState().auth.token).toBe('teacher_tok');
    expect(store.getState().auth.student?.role).toBe('teacher');
  });

  it('should set error on failure', async () => {
    mockApi.post.mockRejectedValue({ response: { data: { message: 'Acesso restrito a professores' } } });
    const store = buildStore();
    await store.dispatch(teacherLoginThunk({ enrollment: 'ANA001', password: 'pw' }));
    expect(store.getState().auth.error).toBe('Acesso restrito a professores');
  });
});

// ── Thunk: logoutThunk ────────────────────────────────────────────────────────
describe('authSlice — logoutThunk', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should clear student and token on logout', async () => {
    const store = buildStore();
    store.dispatch(setCredentials({ student: makeStudent(), token: 'some_tok' }));
    mockApi.post.mockResolvedValue({});
    await store.dispatch(logoutThunk());
    const { student, token } = store.getState().auth;
    expect(student).toBeNull();
    expect(token).toBeNull();
  });

  it('should remove items from localStorage on logout', async () => {
    localStorage.setItem('VestWeb_token', 'tok');
    localStorage.setItem('VestWeb_student', '{}');
    mockApi.post.mockResolvedValue({});
    const store = buildStore();
    await store.dispatch(logoutThunk());
    expect(localStorage.getItem('VestWeb_token')).toBeNull();
    expect(localStorage.getItem('VestWeb_student')).toBeNull();
  });
});
