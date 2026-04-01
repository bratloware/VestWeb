import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import questionsReducer, {
  fetchQuestions,
  fetchSubjects,
  submitAnswer,
  setCurrentQuestion,
  setSession,
  clearError,
  type Question,
} from '../../slices/questionsSlice';

// ── Mock api ──────────────────────────────────────────────────────────────────
vi.mock('../../api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import api from '../../api/api';
const mockApi = api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

// ── Helpers ───────────────────────────────────────────────────────────────────
const buildStore = () => configureStore({ reducer: { questions: questionsReducer } });

const makeQuestion = (id = 1): Question => ({
  id,
  statement: 'What is the mitochondria?',
  topic_id: 2,
  difficulty: 'medium',
  alternatives: [
    { id: 1, question_id: id, letter: 'A', text: 'Cell wall', is_correct: false },
    { id: 2, question_id: id, letter: 'B', text: 'Powerhouse of the cell', is_correct: true },
  ],
});

// ── Synchronous reducers ───────────────────────────────────────────────────────
describe('questionsSlice — synchronous reducers', () => {
  it('setCurrentQuestion should set and clear the current question', () => {
    const store = buildStore();
    store.dispatch(setCurrentQuestion(makeQuestion()));
    expect(store.getState().questions.currentQuestion?.id).toBe(1);
    store.dispatch(setCurrentQuestion(null));
    expect(store.getState().questions.currentQuestion).toBeNull();
  });

  it('setSession should update session in state', () => {
    const store = buildStore();
    store.dispatch(setSession({ id: 99, mode: 'practice' }));
    expect(store.getState().questions.session).toEqual({ id: 99, mode: 'practice' });
  });

  it('clearError should reset error to null', () => {
    const store = buildStore();
    // Manually trigger a rejected action to set an error
    store.dispatch({ type: 'questions/fetchAll/rejected', payload: 'Some error' });
    expect(store.getState().questions.error).toBe('Some error');
    store.dispatch(clearError());
    expect(store.getState().questions.error).toBeNull();
  });
});

// ── fetchQuestions thunk ───────────────────────────────────────────────────────
describe('questionsSlice — fetchQuestions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should populate questions array from API response (paginated)', async () => {
    const questions = [makeQuestion(1), makeQuestion(2)];
    mockApi.get.mockResolvedValue({ data: { data: { rows: questions, count: 2 } } });
    const store = buildStore();
    await store.dispatch(fetchQuestions());
    const state = store.getState().questions;
    expect(state.questions).toHaveLength(2);
    expect(state.total).toBe(2);
    expect(state.loading).toBe(false);
  });

  it('should populate questions array from API response (flat array)', async () => {
    const questions = [makeQuestion(1)];
    mockApi.get.mockResolvedValue({ data: { data: questions } });
    const store = buildStore();
    await store.dispatch(fetchQuestions());
    const state = store.getState().questions;
    expect(state.questions).toHaveLength(1);
    expect(state.total).toBe(1);
  });

  it('should set error on API failure', async () => {
    mockApi.get.mockRejectedValue({ response: { data: { message: 'Server error' } } });
    const store = buildStore();
    await store.dispatch(fetchQuestions());
    expect(store.getState().questions.error).toBe('Server error');
  });

  it('should build correct query params from filters', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [] } });
    const store = buildStore();
    await store.dispatch(fetchQuestions({ subject_id: '3', difficulty: 'hard', limit: 5 }));
    const callUrl: string = mockApi.get.mock.calls[0][0];
    expect(callUrl).toContain('subject_id=3');
    expect(callUrl).toContain('difficulty=hard');
    expect(callUrl).toContain('limit=5');
  });

  it('should ignore empty/falsy filter values', async () => {
    mockApi.get.mockResolvedValue({ data: { data: [] } });
    const store = buildStore();
    await store.dispatch(fetchQuestions({ subject_id: '', topic_id: undefined }));
    const callUrl: string = mockApi.get.mock.calls[0][0];
    expect(callUrl).not.toContain('subject_id');
    expect(callUrl).not.toContain('topic_id');
  });
});

// ── fetchSubjects thunk ────────────────────────────────────────────────────────
describe('questionsSlice — fetchSubjects', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should populate subjects array', async () => {
    const subjects = [{ id: 1, name: 'Biologia', topics: [] }];
    mockApi.get.mockResolvedValue({ data: { data: subjects } });
    const store = buildStore();
    await store.dispatch(fetchSubjects());
    expect(store.getState().questions.subjects).toHaveLength(1);
    expect(store.getState().questions.subjects[0].name).toBe('Biologia');
  });
});

// ── submitAnswer thunk ─────────────────────────────────────────────────────────
describe('questionsSlice — submitAnswer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('should call POST /questions/answer with the correct payload', async () => {
    mockApi.post.mockResolvedValue({ data: { data: { answer: {}, is_correct: true } } });
    const store = buildStore();
    await store.dispatch(submitAnswer({
      session_id: 10, question_id: 1, chosen_alternative_id: 2, response_time_seconds: 8,
    }));
    expect(mockApi.post).toHaveBeenCalledWith('/questions/answer', {
      session_id: 10, question_id: 1, chosen_alternative_id: 2, response_time_seconds: 8,
    });
  });
});
