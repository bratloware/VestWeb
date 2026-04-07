import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HelpCircle, ClipboardList, Play, Calendar, BarChart2, Users, MessageCircle, Zap, Target, Trophy, Flame, Hand, Lightbulb } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/api';
import { RootState } from '../../store/store';
import './Home.css';

interface Metrics {
  total_answered: number;
  accuracy: number;
  rank: number;
  streak: number;
}

const tips = [
  { subject: 'Biologia', text: 'Revise o ciclo celular hoje! Mitose e meiose sao frequentemente cobrados nos principais vestibulares do Brasil.' },
  { subject: 'Quimica', text: 'Pratique balanceamento de equacoes quimicas. Essa habilidade e fundamental para resolver questoes de estequiometria.' },
  { subject: 'Fisica', text: 'Resolva ao menos 5 questoes de cinetica hoje. A pratica constante e a chave para dominar os calculos.' },
  { subject: 'Portugues', text: 'Leia um editorial ou artigo de opiniao hoje. Isso melhora sua interpretacao de texto e vocabulario.' },
];

const quickAccess = [
  { label: 'Questões', icon: HelpCircle, to: '/classroom/questions' },
  { label: 'Simulados', icon: ClipboardList, to: '/classroom/simulations' },
  { label: 'VestWebFlix', icon: Play, to: '/VestWebFlix' },
  { label: 'Calendário', icon: Calendar, to: '/classroom/review-calendar' },
  { label: 'Mentoria', icon: MessageCircle, to: '/classroom/mentoring' },
  { label: 'Métricas', icon: BarChart2, to: '/classroom/metrics' },
  { label: 'Comunidade', icon: Users, to: '/classroom/community' },
  { label: 'Configurações', icon: Zap, to: '/classroom/settings' },
];

const Home = () => {
  const { student } = useSelector((state: RootState) => state.auth);
  const [metrics, setMetrics] = useState<Metrics>({ total_answered: 0, accuracy: 0, rank: 0, streak: 0 });
  const [tip] = useState(tips[Math.floor(Math.random() * tips.length)]);

  useEffect(() => {
    Promise.allSettled([
      api.get('/gamification/streak'),
      api.get('/gamification/leaderboard'),
      api.get('/gamification/stats'),
    ]).then(([streakRes, leaderboardRes, statsRes]) => {
      const streak = streakRes.status === 'fulfilled' ? streakRes.value.data.data?.current_streak || 0 : 0;
      const leaderboard = leaderboardRes.status === 'fulfilled' ? leaderboardRes.value.data.data || [] : [];
      const rank = leaderboard.findIndex((entry: any) => entry.student_id === student?.id) + 1 || 0;
      const total_answered = statsRes.status === 'fulfilled' ? statsRes.value.data.data?.total_answered || 0 : 0;
      const accuracy = statsRes.status === 'fulfilled' ? statsRes.value.data.data?.accuracy || 0 : 0;
      setMetrics({ streak, rank, total_answered, accuracy });
    });
  }, [student?.id]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="home-page">
      <Sidebar />
      <main className="page-content">
        <div className="home-header">
          <h1>{getGreeting()}, <span>{student?.name?.split(' ')[0] || 'Aluno'}</span>!</h1>
          <p>Pronto para mais um dia de estudos? Vamos lá!</p>
        </div>

        <div className="home-metrics">
          <div className="metric-card">
            <div className="metric-icon metric-icon-blue">
              <HelpCircle size={24} />
            </div>
            <div className="metric-info">
              <h3>{metrics.total_answered}</h3>
              <p>Questões respondidas</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon-green">
              <Target size={24} />
            </div>
            <div className="metric-info">
              <h3>{metrics.accuracy}%</h3>
              <p>Taxa de acerto</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon-purple">
              <Trophy size={24} />
            </div>
            <div className="metric-info">
              <h3>{metrics.rank > 0 ? `#${metrics.rank}` : '--'}</h3>
              <p>Posição no ranking</p>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon metric-icon-orange">
              <Flame size={24} />
            </div>
            <div className="metric-info">
              <h3>{metrics.streak}</h3>
              <p>Dias seguidos</p>
            </div>
          </div>
        </div>

        <div className="home-quick-access">
          <h2>Acesso rápido</h2>
          <div className="quick-access-grid">
            {quickAccess.map(item => (
              <Link key={item.to} to={item.to} className="quick-access-btn">
                <div className="quick-access-icon">
                  <item.icon size={20} />
                </div>
                <span className="quick-access-label">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="home-bottom">
          <div className="home-activity">
            <h2>Atividade recente</h2>
            {[
              { icon: HelpCircle, text: 'Respondeu 10 questões de Biologia', time: 'Hoje, 09:32' },
              { icon: ClipboardList, text: 'Completou Simulado FUVEST 2024', time: 'Ontem, 15:20' },
              { icon: Play, text: 'Assistiu: Ciclo Celular - Mitose', time: '2 dias atras' },
              { icon: Users, text: 'Criou post na comunidade', time: '3 dias atras' },
            ].map((a, i) => (
              <div key={i} className="activity-item">
                <div className="activity-dot">
                  <a.icon size={18} />
                </div>
                <div className="activity-text">
                  <strong>{a.text}</strong>
                  <span>{a.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="home-tip">
            <h2><Lightbulb size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Dica do dia</h2>
            <div className="tip-card">
              <div className="tip-subject">{tip.subject}</div>
              <p>{tip.text}</p>
            </div>

            <div className="streak-display">
              <div className="streak-fire"><Flame size={24} /></div>
              <div className="streak-info">
                <strong>{metrics.streak} dias</strong>
                <span>de sequência de estudos</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
