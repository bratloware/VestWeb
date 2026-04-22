import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Video, PenLine, CalendarPlus } from 'lucide-react';

const QuickActions = () => (
  <div className="teacher-quick-actions">
    <Link to="/teacher/VestWebFlix" className="teacher-quick-btn">
      <Video size={16} />
      Nova Aula
    </Link>
    <Link to="/teacher/questions" className="teacher-quick-btn">
      <PenLine size={16} />
      Criar Questão
    </Link>
    <Link to="/teacher/sessions" className="teacher-quick-btn">
      <CalendarPlus size={16} />
      Abrir Agenda
    </Link>
  </div>
);

export default memo(QuickActions);
