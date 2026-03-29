import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { isTeacherRole } from '../utils/roles';

interface TeacherRouteProps {
  children: ReactNode;
}

const TeacherRoute = ({ children }: TeacherRouteProps) => {
  const { token, student } = useSelector((state: RootState) => state.auth);

  if (!token) return <Navigate to="/login" replace />;
  if (!student || !isTeacherRole(student.role)) return <Navigate to="/select-platform" replace />;

  return <>{children}</>;
};

export default TeacherRoute;
