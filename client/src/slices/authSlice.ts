import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../api/api';

export interface Student {
  id: number;
  name: string;
  email: string;
  enrollment: string;
  avatar_url: string | null;
  role: 'student' | 'teacher' | 'admin';
  created_at: string;
}

interface AuthState {
  student: Student | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const storedToken = localStorage.getItem('sinapse_token');
const storedStudent = localStorage.getItem('sinapse_student');

const initialState: AuthState = {
  student: storedStudent ? JSON.parse(storedStudent) : null,
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
    localStorage.removeItem('sinapse_token');
    localStorage.removeItem('sinapse_student');
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ student: Student; token: string }>) {
      state.student = action.payload.student;
      state.token = action.payload.token;
    },
    clearAuth(state) {
      state.student = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('sinapse_token');
      localStorage.removeItem('sinapse_student');
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.student = action.payload.student;
        localStorage.setItem('sinapse_token', action.payload.token);
        localStorage.setItem('sinapse_student', JSON.stringify(action.payload.student));
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(teacherLoginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(teacherLoginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.student = action.payload.student;
        localStorage.setItem('sinapse_token', action.payload.token);
        localStorage.setItem('sinapse_student', JSON.stringify(action.payload.student));
      })
      .addCase(teacherLoginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.student = action.payload;
        localStorage.setItem('sinapse_student', JSON.stringify(action.payload));
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.student = null;
        state.token = null;
        state.error = null;
      });
  },
});

export const { setCredentials, clearAuth, setError, setLoading } = authSlice.actions;
export default authSlice.reducer;
