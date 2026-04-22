import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../api/api';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  enrollment: string;
  avatar_url: string | null;
  role: 'student' | 'teacher' | 'admin';
  type: 'student' | 'teacher';
  target_vestibular_id?: number | null;
  created_at: string;
}

// Keep backward compat alias
export type Student = AuthUser;

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const storedToken = localStorage.getItem('VestWeb_token');
const storedUser = localStorage.getItem('VestWeb_user') || localStorage.getItem('VestWeb_student');

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken,
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ enrollment, password }: { enrollment: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', { enrollment, password });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao fazer login');
    }
  }
);

export const teacherLoginThunk = createAsyncThunk(
  'auth/teacherLogin',
  async ({ enrollment, password }: { enrollment: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/teacher-login', { enrollment, password });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao fazer login');
    }
  }
);

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/auth/me');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao buscar usuário');
    }
  }
);

export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.removeItem('VestWeb_token');
    localStorage.removeItem('VestWeb_user');
    localStorage.removeItem('VestWeb_student');
  }
);

const persist = (token: string, user: AuthUser) => {
  localStorage.setItem('VestWeb_token', token);
  localStorage.setItem('VestWeb_user', JSON.stringify(user));
  localStorage.removeItem('VestWeb_student');
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    clearAuth(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('VestWeb_token');
      localStorage.removeItem('VestWeb_user');
      localStorage.removeItem('VestWeb_student');
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    updateUser(state, action: PayloadAction<Partial<AuthUser>>) {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('VestWeb_user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user ?? action.payload.student;
        persist(action.payload.token, state.user!);
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(teacherLoginThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(teacherLoginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user ?? action.payload.student;
        persist(action.payload.token, state.user!);
      })
      .addCase(teacherLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('VestWeb_user', JSON.stringify(action.payload));
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.error = null;
      });
  },
});

export const { setCredentials, clearAuth, setError, setLoading, updateUser } = authSlice.actions;
export default authSlice.reducer;
