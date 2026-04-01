import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import ProtectedRoute from './components/ProtectedRoute';
import TeacherRoute from './components/TeacherRoute';
import LandingPage from './pages/LandingPage/LandingPage';
import LoginPage from './pages/LoginPage/LoginPage';
import TeacherLoginPage from './pages/TeacherLoginPage/TeacherLoginPage';
import TeacherHome from './pages/TeacherArea/TeacherHome';
import TeacherSessions from './pages/TeacherArea/TeacherSessions';
import TeacherQuestions from './pages/TeacherArea/TeacherQuestions';
import TeacherVestWebFlix from './pages/TeacherArea/TeacherSinaflix';
import TeacherSettings from './pages/TeacherArea/TeacherSettings';
import SelectPlatform from './pages/SelectPlatform/SelectPlatform';
import VestWebFlix from './pages/Sinaflix/Sinaflix';
import Home from './pages/Home/Home';
import Questions from './pages/Questions/Questions';
import Simulations from './pages/Simulations/Simulations';
import ReviewCalendar from './pages/ReviewCalendar/ReviewCalendar';
import StudyRoom from './pages/StudyRoom/StudyRoom';
import Metrics from './pages/Metrics/Metrics';
import Community from './pages/Community/Community';
import Mentoring from './pages/Mentoring/Mentoring';
import Settings from './pages/Settings/Settings';

function App() {
  const { mode } = useSelector((state: RootState) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/teacher/login" element={<TeacherLoginPage />} />
      <Route path="/select-platform" element={
        <ProtectedRoute><SelectPlatform /></ProtectedRoute>
      } />
      <Route path="/VestWebFlix" element={
        <ProtectedRoute><VestWebFlix /></ProtectedRoute>
      } />
      <Route path="/classroom/home" element={
        <ProtectedRoute><Home /></ProtectedRoute>
      } />
      <Route path="/classroom/questions" element={
        <ProtectedRoute><Questions /></ProtectedRoute>
      } />
      <Route path="/classroom/simulations" element={
        <ProtectedRoute><Simulations /></ProtectedRoute>
      } />
      <Route path="/classroom/review-calendar" element={
        <ProtectedRoute><ReviewCalendar /></ProtectedRoute>
      } />
      <Route path="/classroom/study-room" element={
        <ProtectedRoute><StudyRoom /></ProtectedRoute>
      } />
      <Route path="/classroom/metrics" element={
        <ProtectedRoute><Metrics /></ProtectedRoute>
      } />
      <Route path="/classroom/community" element={
        <ProtectedRoute><Community /></ProtectedRoute>
      } />
      <Route path="/classroom/mentoring" element={
        <ProtectedRoute><Mentoring /></ProtectedRoute>
      } />
      <Route path="/classroom/settings" element={
        <ProtectedRoute><Settings /></ProtectedRoute>
      } />

      <Route path="/teacher/home" element={
        <TeacherRoute><TeacherHome /></TeacherRoute>
      } />
      <Route path="/teacher/questions" element={
        <TeacherRoute><TeacherQuestions /></TeacherRoute>
      } />
      <Route path="/teacher/VestWebFlix" element={
        <TeacherRoute><TeacherVestWebFlix /></TeacherRoute>
      } />
      <Route path="/teacher/sessions" element={
        <TeacherRoute><TeacherSessions /></TeacherRoute>
      } />
      <Route path="/teacher/settings" element={
        <TeacherRoute><TeacherSettings /></TeacherRoute>
      } />
    </Routes>
  );
}

export default App;
