import { ReactNode, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { fetchMe } from '../slices/authSlice';

interface TeacherRouteProps {
  children: ReactNode;
}

const TeacherRoute = ({ children }: TeacherRouteProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, authChecked, checkingSession } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!authChecked && !checkingSession) {
      dispatch(fetchMe());
    }
  }, [authChecked, checkingSession, dispatch]);

  if (!authChecked || checkingSession) {
    return null;
  }

  if (!user) return <Navigate to="/teacher/login" replace />;
  if (user.type !== 'teacher') return <Navigate to="/select-platform" replace />;

  return <>{children}</>;
};

export default TeacherRoute;
