import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../api/api';

export interface Video {
  id: number;
  title: string;
  description?: string;
  youtube_url: string;
  thumbnail_url?: string;
  topic_id?: number;
  created_by?: number;
  published_at?: string;
  created_at: string;
  topic?: { id: number; name: string; subject?: { id: number; name: string } };
  progress?: { watched: boolean; progress_seconds: number };
  isFavorite?: boolean;
}

interface VideosState {
  videos: Video[];
  currentVideo: Video | null;
  favorites: any[];
  loading: boolean;
  error: string | null;
}

const initialState: VideosState = {
  videos: [],
  currentVideo: null,
  favorites: [],
  loading: false,
  error: null,
};

export const fetchVideos = createAsyncThunk(
  'videos/fetchAll',
  async (filters: Record<string, any> = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, String(v)); });
      const res = await api.get(`/videos?${params.toString()}`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao buscar vídeos');
    }
  }
);

export const fetchVideoById = createAsyncThunk(
  'videos/fetchById',
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await api.get(`/videos/${id}`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao buscar vídeo');
    }
  }
);

export const updateProgress = createAsyncThunk(
  'videos/updateProgress',
  async ({ id, watched, progress_seconds }: { id: number; watched?: boolean; progress_seconds?: number }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/videos/${id}/progress`, { watched, progress_seconds });
      return { id, progress: res.data.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao atualizar progresso');
    }
  }
);

export const toggleFavorite = createAsyncThunk(
  'videos/toggleFavorite',
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await api.post(`/videos/${id}/favorite`);
      return { id, isFavorite: res.data.data.isFavorite };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao favoritar vídeo');
    }
  }
);

export const fetchFavorites = createAsyncThunk(
  'videos/fetchFavorites',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/videos/favorites');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao buscar favoritos');
    }
  }
);

const videosSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    setCurrentVideo(state, action: PayloadAction<Video | null>) {
      state.currentVideo = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVideos.pending, (state) => { state.loading = true; })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.loading = false;
        state.videos = action.payload;
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchVideoById.fulfilled, (state, action) => {
        state.currentVideo = action.payload;
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const video = state.videos.find(v => v.id === action.payload.id);
        if (video) video.isFavorite = action.payload.isFavorite;
        if (state.currentVideo?.id === action.payload.id) {
          state.currentVideo.isFavorite = action.payload.isFavorite;
        }
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.favorites = action.payload;
      });
  },
});

export const { setCurrentVideo } = videosSlice.actions;
export default videosSlice.reducer;
