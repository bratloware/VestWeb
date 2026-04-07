import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { HelpCircle, MessageCircle, CheckCircle, Clock } from 'lucide-react';
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

const TeacherHome = () => {
  const { student } = useSelector((state: RootState) => state.auth);
  const [questionCount, setQuestionCount] = useState(0);
  const [sessions, setSessions] = useState<SessionSummary>({ total: 0, pending: 0, confirmed: 0, done: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, sRes] = await Promise.all([
          api.get('/teacher/questions'),
          api.get('/teacher/sessions'),
        ]);
        setQuestionCount(qRes.data.data.length);
        const all = sRes.data.data;
        setSessions({
          total: all.length,
          pending: all.filter((s: any) => s.status === 'pending').length,
          confirmed: all.filter((s: any) => s.status === 'confirmed').length,
          done: all.filter((s: any) => s.status === 'done').length,
        });
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

          <div className="teacher-home-shortcuts">
            <h2>Acesso rápido</h2>
            <div className="teacher-shortcuts-grid">
              <Link to="/teacher/questions" className="teacher-shortcut">
                <div className="teacher-shortcut-icon">
                  <HelpCircle size={22} />
                </div>
                <span>Gerenciar Questões</span>
              </Link>
              <Link to="/teacher/sessions" className="teacher-shortcut">
                <div className="teacher-shortcut-icon">
                  <MessageCircle size={22} />
                </div>
                <span>Sessões de Mentoria</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherHome;
