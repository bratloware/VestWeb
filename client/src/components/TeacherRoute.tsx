import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

interface TeacherRouteProps {
  children: ReactNode;
}

const TeacherRoute = ({ children }: TeacherRouteProps) => {
  const { token, user } = useSelector((state: RootState) => state.auth);

  if (!token) return <Navigate to="/teacher/login" replace />;
  if (!user || (user.type !== 'teacher' && user.role !== 'admin')) {
    return <Navigate to="/select-platform" replace />;
  }

  return <>{children}</>;
};

export default TeacherRoute;
