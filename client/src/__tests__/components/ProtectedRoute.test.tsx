import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../slices/authSlice';
import questionsReducer from '../../slices/questionsSlice';
import simulationsReducer from '../../slices/simulationsSlice';
import videosReducer from '../../slices/videosSlice';
import communityReducer from '../../slices/communitySlice';
import ProtectedRoute from '../../components/ProtectedRoute';

// ── Helpers ───────────────────────────────────────────────────────────────────
const buildStore = (token: string | null) =>
  configureStore({
    reducer: {
      auth: authReducer,
      questions: questionsReducer,
      simulations: simulationsReducer,
      videos: videosReducer,
      community: communityReducer,
    },
    preloadedState: {
      auth: {
        token,
        student: token
          ? { id: 1, name: 'Ana', email: 'a@b.com', enrollment: 'ANA001', avatar_url: null, role: 'student' as const, created_at: '' }
          : null,
        loading: false,
        error: null,
      },
    },
  });

const renderWithStore = (token: string | null) =>
  render(
    <Provider store={buildStore(token)}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('ProtectedRoute', () => {
  it('should render children when the user is authenticated (token exists)', () => {
    renderWithStore('valid_token');
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to /login when there is no token', () => {
    renderWithStore(null);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to /login when token is an empty string', () => {
    renderWithStore('');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
