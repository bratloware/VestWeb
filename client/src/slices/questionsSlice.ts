import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../api/api';

export interface Alternative {
  id: number;
  question_id: number;
  letter: 'A' | 'B' | 'C' | 'D' | 'E';
  text: string;
  image_url?: string | null;
  is_correct: boolean;
}

export interface Vestibular {
  id: number;
  name: string;
  full_name?: string;
  institution?: string;
  state?: string;
}

export interface Subtopic {
  id: number;
  name: string;
  topic_id: number;
}

export interface Question {
  id: number;
  statement: string;
  image_url?: string | null;
  topic_id?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  source?: string;
  year?: number;
  bank?: string;
  correctAlternative?: string;
  reference?: string | null;
  subject?: string;
  subject_id?: number;
  vestibular?: string;
  vestibular_id?: number;
  alternatives: Alternative[];
}

export interface Subject {
  id: number;
  name: string;
  topics: { id: number; name: string; subject_id: number; subtopics: Subtopic[] }[];
}

interface QuestionsState {
  questions: Question[];
  subjects: Subject[];
  vestibulares: Vestibular[];
  currentQuestion: Question | null;
  session: any | null;
  loading: boolean;
  error: string | null;
  total: number;
}

const initialState: QuestionsState = {
  questions: [],
  subjects: [],
  vestibulares: [],
  currentQuestion: null,
  session: null,
  loading: false,
  error: null,
  total: 0,
};

export const fetchQuestions = createAsyncThunk(
  'questions/fetchAll',
  async (filters: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, String(v)); });
      const res = await api.get(`/questions?${params.toString()}`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao buscar questões');
    }
  }
);

export const fetchSubjects = createAsyncThunk(
  'questions/fetchSubjects',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/questions/subjects');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao buscar matérias');
    }
  }
);

export const fetchVestibulares = createAsyncThunk(
  'questions/fetchVestibulares',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/questions/vestibulares');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao buscar vestibulares');
    }
  }
);

export const setTargetVestibular = createAsyncThunk(
  'questions/setTargetVestibular',
  async (vestibular_id: number | null, { rejectWithValue }) => {
    try {
      const res = await api.post('/questions/target-vestibular', { vestibular_id });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao definir vestibular alvo');
    }
  }
);

export const submitAnswer = createAsyncThunk(
  'questions/submitAnswer',
  async (payload: { session_id: number; question_id: number; chosen_alternative_id: number; response_time_seconds?: number }, { rejectWithValue }) => {
    try {
      const res = await api.post('/questions/answer', payload);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao submeter resposta');
    }
  }
);

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    setCurrentQuestion(state, action: PayloadAction<Question | null>) {
      state.currentQuestion = action.payload;
    },
    setSession(state, action: PayloadAction<any>) {
      state.session = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestions.pending, (state) => { state.loading = true; })
      .addCase(fetchQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload.rows || action.payload;
        state.total = action.payload.count || action.payload.length;
      })
      .addCase(fetchQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchSubjects.fulfilled, (state, action) => {
        state.subjects = action.payload;
      })
      .addCase(fetchVestibulares.fulfilled, (state, action) => {
        state.vestibulares = action.payload;
      });
  },
});

export const { setCurrentQuestion, setSession, clearError } = questionsSlice.actions;
export default questionsSlice.reducer;
