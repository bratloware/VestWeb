import { LayoutDashboard, HelpCircle, MessageCircle, Settings, Play, ShieldCheck } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Sidebar, { NavItem } from './Sidebar';

const baseItems: NavItem[] = [
  { label: 'Home', icon: LayoutDashboard, to: '/teacher/home' },
  { label: 'Questões', icon: HelpCircle, to: '/teacher/questions' },
  { label: 'VestWebFlix', icon: Play, to: '/teacher/VestWebFlix' },
  { label: 'Sessões de Mentoria', icon: MessageCircle, to: '/teacher/sessions' },
  { label: 'Configurações', icon: Settings, to: '/teacher/settings' },
];

const adminItem: NavItem = { label: 'Área Admin', icon: ShieldCheck, to: '/teacher/admin' };

const TeacherSidebar = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const navItems = user?.role === 'admin' ? [...baseItems, adminItem] : baseItems;
  return <Sidebar navItems={navItems} roleLabel="Professor" />;
};

export default TeacherSidebar;
