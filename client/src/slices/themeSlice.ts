import { createSlice } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark';

const stored = localStorage.getItem('theme') as Theme | null;

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: stored ?? ('dark' as Theme) },
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.mode);
    },
  },
});

export const { toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;
