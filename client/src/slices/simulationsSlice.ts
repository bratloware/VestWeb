import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../api/api';

export interface Simulation {
  id: number;
  title: string;
  subject_id?: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  total_questions: number;
  time_limit_minutes: number;
  is_weekly: boolean;
  created_at: string;
  simulationQuestions?: any[];
}

interface SimulationsState {
  simulations: Simulation[];
  currentSimulation: Simulation | null;
  session: any | null;
  history: any[];
  loading: boolean;
  error: string | null;
}

const initialState: SimulationsState = {
  simulations: [],
  currentSimulation: null,
  session: null,
  history: [],
  loading: false,
  error: null,
};

export const fetchSimulations = createAsyncThunk(
  'simulations/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/simulations');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao buscar simulados');
    }
  }
);

export const fetchSimulationById = createAsyncThunk(
  'simulations/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await api.get(`/simulations/${id}`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao buscar simulado');
    }
  }
);

export const startSession = createAsyncThunk(
  'simulations/startSession',
  async (simulationId: number, { rejectWithValue }) => {
    try {
      const res = await api.post(`/simulations/${simulationId}/start`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao iniciar sessão');
    }
  }
);

export const finishSession = createAsyncThunk(
  'simulations/finishSession',
  async (sessionId: number, { rejectWithValue }) => {
    try {
      const res = await api.post(`/simulations/sessions/${sessionId}/finish`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao finalizar sessão');
    }
  }
);

export const fetchHistory = createAsyncThunk(
  'simulations/fetchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/simulations/history');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao buscar histórico');
    }
  }
);

const simulationsSlice = createSlice({
  name: 'simulations',
  initialState,
  reducers: {
    clearSession(state) {
      state.session = null;
    },
    setCurrentSimulation(state, action: PayloadAction<Simulation | null>) {
      state.currentSimulation = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSimulations.pending, (state) => { state.loading = true; })
      .addCase(fetchSimulations.fulfilled, (state, action) => {
        state.loading = false;
        state.simulations = action.payload;
      })
      .addCase(fetchSimulations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSimulationById.fulfilled, (state, action) => {
        state.currentSimulation = action.payload;
      })
      .addCase(startSession.fulfilled, (state, action) => {
        state.session = action.payload;
      })
      .addCase(finishSession.fulfilled, (state, action) => {
        state.session = { ...state.session, ...action.payload };
      })
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      });
  },
});

export const { clearSession, setCurrentSimulation } = simulationsSlice.actions;
export default simulationsSlice.reducer;
