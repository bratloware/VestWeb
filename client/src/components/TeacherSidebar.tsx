import { LayoutDashboard, HelpCircle, MessageCircle, Settings, Play } from 'lucide-react';
import Sidebar, { NavItem } from './Sidebar';

const teacherNavItems: NavItem[] = [
  { label: 'Home', icon: LayoutDashboard, to: '/teacher/home' },
  { label: 'Questões', icon: HelpCircle, to: '/teacher/questions' },
  { label: 'Sinaflix', icon: Play, to: '/teacher/sinaflix' },
  { label: 'Sessões de Mentoria', icon: MessageCircle, to: '/teacher/sessions' },
  { label: 'Configurações', icon: Settings, to: '/teacher/settings' },
];

const TeacherSidebar = () => (
  <Sidebar navItems={teacherNavItems} roleLabel="Professor" />
);

export default TeacherSidebar;
