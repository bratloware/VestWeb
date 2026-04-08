import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { HelpCircle, MessageCircle, CheckCircle, Clock, CalendarDays } from 'lucide-react';
import { RootState } from '../../store/store';
import TeacherSidebar from '../../components/TeacherSidebar';
import api from '../../api/api';
import './TeacherHome.css';

interface SessionSummary {
  total: number;
  pending: number;
  confirmed: number;
  done: number;
}

interface UpcomingSession {
  id: number;
  scheduled_at: string;
  status: 'pending' | 'confirmed';
  notes: string | null;
  student: { id: number; name: string; avatar_url: string | null; enrollment: string };
}

const getInitials = (name: string) =>
  name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

const TeacherHome = () => {
  const { student } = useSelector((state: RootState) => state.auth);
  const [questionCount, setQuestionCount] = useState(0);
  const [sessions, setSessions] = useState<SessionSummary>({ total: 0, pending: 0, confirmed: 0, done: 0 });
  const [upcoming, setUpcoming] = useState<UpcomingSession[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, sRes] = await Promise.all([
          api.get('/teacher/questions'),
          api.get('/teacher/sessions'),
        ]);
        setQuestionCount(qRes.data.data.length);
        const all: any[] = sRes.data.data;
        setSessions({
          total: all.length,
          pending: all.filter(s => s.status === 'pending').length,
          confirmed: all.filter(s => s.status === 'confirmed').length,
          done: all.filter(s => s.status === 'done').length,
        });

        const now = new Date();
        const next = all
          .filter(s => (s.status === 'pending' || s.status === 'confirmed') && new Date(s.scheduled_at) > now)
          .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
          .slice(0, 4);
        setUpcoming(next);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const firstName = (student?.name ?? '').replace(/^PROF\.\s*/i, '').split(' ').slice(0, 2).join(' ');

  return (
    <div className="teacher-layout">
      <TeacherSidebar />
      <main className="teacher-main">
        <div className="teacher-home">
          <div className="teacher-home-greeting">
            <h1>{getGreeting()}, {firstName}!</h1>
            <p>Aqui está um resumo da sua área.</p>
          </div>

          <div className="teacher-home-cards">
            <div className="teacher-stat-card">
              <div className="teacher-stat-icon teacher-stat-icon-blue">
                <HelpCircle size={24} />
              </div>
              <div>
                <span className="teacher-stat-number">{questionCount}</span>
                <span className="teacher-stat-label">Questões criadas</span>
              </div>
            </div>
            <div className="teacher-stat-card">
              <div className="teacher-stat-icon teacher-stat-icon-green">
                <MessageCircle size={24} />
              </div>
              <div>
                <span className="teacher-stat-number">{sessions.total}</span>
                <span className="teacher-stat-label">Total de sessões</span>
              </div>
            </div>
            <div className="teacher-stat-card">
              <div className="teacher-stat-icon teacher-stat-icon-orange">
                <Clock size={24} />
              </div>
              <div>
                <span className="teacher-stat-number">{sessions.pending}</span>
                <span className="teacher-stat-label">Sessões pendentes</span>
              </div>
            </div>
            <div className="teacher-stat-card">
              <div className="teacher-stat-icon teacher-stat-icon-purple">
                <CheckCircle size={24} />
              </div>
              <div>
                <span className="teacher-stat-number">{sessions.done}</span>
                <span className="teacher-stat-label">Sessões realizadas</span>
              </div>
            </div>
          </div>

          <div className="teacher-upcoming">
            <div className="teacher-upcoming-header">
              <div className="teacher-upcoming-title">
                <CalendarDays size={18} />
                <h2>Próximas sessões</h2>
              </div>
              <Link to="/teacher/sessions" className="teacher-upcoming-all">
                Ver todas
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <div className="teacher-upcoming-empty">
                <MessageCircle size={32} />
                <p>Nenhuma sessão agendada.</p>
                <span>Quando alunos agendarem mentorias elas aparecerão aqui.</span>
              </div>
            ) : (
              <ul className="teacher-upcoming-list">
                {upcoming.map(s => {
                  const date = new Date(s.scheduled_at);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const dayLabel = isToday
                    ? 'Hoje'
                    : date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
                  const timeLabel = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <li key={s.id} className={`teacher-upcoming-item${isToday ? ' today' : ''}`}>
                      <div className="teacher-upcoming-avatar">
                        {s.student.avatar_url
                          ? <img src={s.student.avatar_url} alt={s.student.name} />
                          : getInitials(s.student.name)
                        }
                      </div>
                      <div className="teacher-upcoming-info">
                        <strong>{s.student.name}</strong>
                        <span>
                          <Clock size={12} />
                          {dayLabel} às {timeLabel}
                        </span>
                      </div>
                      <span className={`teacher-upcoming-badge ${s.status}`}>
                        {s.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                      </span>
                      <Link to="/teacher/sessions" className="teacher-upcoming-btn">
                        {isToday ? 'Entrar na sala' : 'Ver detalhes'}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherHome;
