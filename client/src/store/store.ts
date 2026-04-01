import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slices/authSlice';
import questionsReducer from '../slices/questionsSlice';
import simulationsReducer from '../slices/simulationsSlice';
import videosReducer from '../slices/videosSlice';
import communityReducer from '../slices/communitySlice';
import themeReducer from '../slices/themeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    questions: questionsReducer,
    simulations: simulationsReducer,
    videos: videosReducer,
    community: communityReducer,
    theme: themeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
