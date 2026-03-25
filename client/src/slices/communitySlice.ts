import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../api/api';

export interface Post {
  id: number;
  student_id: number;
  content: string;
  image_url?: string;
  created_at: string;
  student?: { id: number; name: string; avatar_url: string | null };
  like_count?: number;
  comment_count?: number;
  liked_by_me?: boolean;
}

export interface Comment {
  id: number;
  post_id: number;
  student_id: number;
  content: string;
  parent_id?: number | null;
  created_at: string;
  student?: { id: number; name: string; avatar_url: string | null };
  replies?: Comment[];
}

interface CommunityState {
  posts: Post[];
  comments: Comment[];
  ranking: any[];
  loading: boolean;
  error: string | null;
  total: number;
}

const initialState: CommunityState = {
  posts: [],
  comments: [],
  ranking: [],
  loading: false,
  error: null,
  total: 0,
};

export const fetchPosts = createAsyncThunk(
  'community/fetchPosts',
  async (page: number = 1, { rejectWithValue }) => {
    try {
      const res = await api.get(`/community/posts?page=${page}&limit=10`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao buscar posts');
    }
  }
);

export const createPost = createAsyncThunk(
  'community/createPost',
  async (payload: { content: string; image_url?: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/community/posts', payload);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao criar post');
    }
  }
);

export const likePost = createAsyncThunk(
  'community/likePost',
  async (postId: number, { rejectWithValue }) => {
    try {
      const res = await api.post(`/community/posts/${postId}/like`);
      return { postId, liked: res.data.data.liked };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao curtir post');
    }
  }
);

export const fetchComments = createAsyncThunk(
  'community/fetchComments',
  async (postId: number, { rejectWithValue }) => {
    try {
      const res = await api.get(`/community/posts/${postId}/comments`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao buscar comentários');
    }
  }
);

export const addComment = createAsyncThunk(
  'community/addComment',
  async ({ postId, content, parent_id }: { postId: number; content: string; parent_id?: number }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/community/posts/${postId}/comments`, { content, parent_id });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao adicionar comentário');
    }
  }
);

export const fetchRanking = createAsyncThunk(
  'community/fetchRanking',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/community/ranking');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Erro ao buscar ranking');
    }
  }
);

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    clearComments(state) {
      state.comments = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => { state.loading = true; })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.rows || action.payload;
        state.total = action.payload.count || 0;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift({ ...action.payload, like_count: 0, comment_count: 0, liked_by_me: false });
      })
      .addCase(likePost.fulfilled, (state, action) => {
        const post = state.posts.find(p => p.id === action.payload.postId);
        if (post) {
          post.liked_by_me = action.payload.liked;
          post.like_count = (post.like_count || 0) + (action.payload.liked ? 1 : -1);
        }
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.comments = action.payload;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.comments.push(action.payload);
      })
      .addCase(fetchRanking.fulfilled, (state, action) => {
        state.ranking = action.payload;
      });
  },
});

export const { clearComments } = communitySlice.actions;
export default communitySlice.reducer;
