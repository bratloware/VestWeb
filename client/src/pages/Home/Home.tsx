import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  HelpCircle, ClipboardList, Play, Calendar, BarChart2, Users,
  MessageCircle, Zap, Target, Trophy, Flame, Lightbulb,
  CheckCircle2, Circle, Plus, Rocket, BookOpen, Video, Megaphone, X,
} from 'lucide-react';
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

interface WeekEvent {
  id: number;
  title: string;
  date: string;
  start_time?: string;
  type: 'review' | 'study_block';
  done: boolean;
}

interface ResumeItem {
  id: string;
  type: 'Simulado' | 'Videoaula' | 'Mentoria';
  title: string;
  subject: string;
  progress: number;
  to: string;
  thumbnail?: string;
  color: string;
  btnLabel: string;
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

const onboardingSteps = [
  { icon: HelpCircle, color: '#2563eb', title: 'Responda sua primeira questão', desc: 'Teste seus conhecimentos e veja como está seu desempenho.', to: '/classroom/questions', btn: 'Começar' },
  { icon: Video, color: '#059669', title: 'Assista uma videoaula', desc: 'Mais de 100 aulas com os melhores professores do VestWebFlix.', to: '/VestWebFlix', btn: 'Explorar' },
  { icon: BookOpen, color: '#7c3aed', title: 'Faça um simulado', desc: 'Pratique com provas anteriores e veja seu ranking.', to: '/classroom/simulations', btn: 'Ver simulados' },
];

const subjectColors: Record<string, string> = {
  biologia: '#059669', química: '#2563eb', física: '#7c3aed',
  matemática: '#ea580c', português: '#dc2626', história: '#b45309',
  geografia: '#0891b2',
};
const colorFor = (s?: string) => (s && subjectColors[s.toLowerCase()]) ?? 'var(--primary)';

const getYtThumb = (url: string) => {
  const m = url?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&\n?#]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg` : undefined;
};

const Home = () => {
  const { student } = useSelector((state: RootState) => state.auth);
  const [metrics, setMetrics] = useState<Metrics>({ total_answered: 0, accuracy: 0, rank: 0, streak: 0 });
  const [metricsLoaded, setMetricsLoaded] = useState(false);
  const [tip] = useState(tips[Math.floor(Math.random() * tips.length)]);
  const [weekEvents, setWeekEvents] = useState<WeekEvent[]>([]);
  const [resumeItems, setResumeItems] = useState<ResumeItem[]>([]);
  const [resumeLoaded, setResumeLoaded] = useState(false);
  const [announcements, setAnnouncements] = useState<{ id: number; content: string; mentor: { student: { name: string } } }[]>([]);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('dismissed_announcements') ?? '[]'); } catch { return []; }
  });

  useEffect(() => {
    api.get('/teacher/announcements/feed')
      .then(res => setAnnouncements(res.data.data ?? []))
      .catch(() => {});
  }, []);

  const dismissAnnouncement = (id: number) => {
    const next = [...dismissedAnnouncements, id];
    setDismissedAnnouncements(next);
    localStorage.setItem('dismissed_announcements', JSON.stringify(next));
  };

  const visibleAnnouncements = announcements.filter(a => !dismissedAnnouncements.includes(a.id));

  // Metrics + calendar
  useEffect(() => {
    Promise.allSettled([
      api.get('/gamification/streak'),
      api.get('/gamification/leaderboard'),
      api.get('/gamification/stats'),
      api.get('/calendar/events'),
    ]).then(([streakRes, leaderboardRes, statsRes, eventsRes]) => {
      const streak = streakRes.status === 'fulfilled' ? streakRes.value.data.data?.current_streak || 0 : 0;
      const leaderboard = leaderboardRes.status === 'fulfilled' ? leaderboardRes.value.data.data || [] : [];
      const rank = leaderboard.findIndex((e: any) => e.student_id === student?.id) + 1 || 0;
      const total_answered = statsRes.status === 'fulfilled' ? statsRes.value.data.data?.total_answered || 0 : 0;
      const accuracy = statsRes.status === 'fulfilled' ? statsRes.value.data.data?.accuracy || 0 : 0;
      setMetrics({ streak, rank, total_answered, accuracy });
      setMetricsLoaded(true);

      if (eventsRes.status === 'fulfilled') {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const all: WeekEvent[] = eventsRes.value.data.data || [];
        setWeekEvents(
          all
            .filter(e => { const d = new Date(e.date + 'T12:00:00'); return d >= startOfWeek && d <= endOfWeek; })
            .sort((a, b) => (a.date + (a.start_time || '')) > (b.date + (b.start_time || '')) ? 1 : -1)
            .slice(0, 5)
        );
      }
    });
  }, [student?.id]);

  // Resume items: videos in progress + active sim session + upcoming mentoring
  // Falls back to recently watched/completed content when nothing is actively in progress
  useEffect(() => {
    Promise.allSettled([
      api.get('/videos'),
      api.get('/simulations/sessions/active'),
      api.get('/mentoring/sessions'),
      api.get('/simulations/history'),
    ]).then(([videosRes, activeSimRes, mentoringRes, histRes]) => {
      const items: ResumeItem[] = [];

      // Videos — in-progress first, fallback to last watched
      if (videosRes.status === 'fulfilled') {
        const vids: any[] = videosRes.value.data.data || [];
        const inProgress = vids.filter(v => v.progress?.progress_seconds > 0 && !v.progress?.watched);

        if (inProgress.length > 0) {
          inProgress.slice(0, 2).forEach(v => {
            const duration = v.duration_seconds || 600;
            items.push({
              id: `video-${v.id}`,
              type: 'Videoaula',
              title: v.title,
              subject: v.topic?.subject?.name || 'VestWebFlix',
              progress: Math.min(Math.round((v.progress.progress_seconds / duration) * 100), 99),
              to: '/VestWebFlix',
              thumbnail: getYtThumb(v.youtube_url),
              color: colorFor(v.topic?.subject?.name),
              btnLabel: 'Continuar',
            });
          });
        } else {
          // fallback: last watched video
          const watched = vids
            .filter(v => v.progress?.watched)
            .sort((a, b) => (b.progress?.updated_at ?? '') > (a.progress?.updated_at ?? '') ? 1 : -1)
            .slice(0, 1);
          watched.forEach(v => {
            items.push({
              id: `video-${v.id}`,
              type: 'Videoaula',
              title: v.title,
              subject: v.topic?.subject?.name || 'VestWebFlix',
              progress: 100,
              to: '/VestWebFlix',
              thumbnail: getYtThumb(v.youtube_url),
              color: colorFor(v.topic?.subject?.name),
              btnLabel: 'Rever',
            });
          });
        }
      }

      // Simulation — active session first, fallback to last history entry
      let simAdded = false;
      if (activeSimRes.status === 'fulfilled') {
        const sessions: any[] = activeSimRes.value.data.data
          ? [activeSimRes.value.data.data].flat()
          : [];
        sessions.slice(0, 1).forEach(s => {
          const total = s.simulation?.total_questions || s.total_questions || 0;
          const answered = s.answers_count ?? s.questions_answered ?? 0;
          const progress = total > 0 ? Math.round((answered / total) * 100) : 0;
          items.push({
            id: `sim-${s.id}`,
            type: 'Simulado',
            title: s.simulation?.title || 'Simulado em andamento',
            subject: s.simulation?.subject?.name || 'Simulados',
            progress,
            to: '/classroom/simulations',
            color: '#7c3aed',
            btnLabel: 'Retomar',
          });
          simAdded = true;
        });
      }

      if (!simAdded && histRes.status === 'fulfilled') {
        const hist: any[] = histRes.value.data.data || [];
        hist.slice(0, 1).forEach(h => {
          const total = h.total_questions || h.simulation?.total_questions || 0;
          const correct = h.correct_answers ?? h.score ?? 0;
          const progress = total > 0 ? Math.round((correct / total) * 100) : 0;
          items.push({
            id: `sim-hist-${h.id}`,
            type: 'Simulado',
            title: h.simulation?.title || h.title || 'Simulado',
            subject: h.simulation?.subject?.name || 'Simulados',
            progress,
            to: '/classroom/simulations',
            color: '#7c3aed',
            btnLabel: 'Rever',
          });
        });
      }

      // Next upcoming mentoring session
      if (mentoringRes.status === 'fulfilled') {
        const sessions: any[] = mentoringRes.value.data.data || [];
        const now = new Date();
        const upcoming = sessions
          .filter(s => (s.status === 'pending' || s.status === 'confirmed') && new Date(s.scheduled_at) > now)
          .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
          .slice(0, 1);

        upcoming.forEach(s => {
          const date = new Date(s.scheduled_at);
          const formatted = date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
          const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          items.push({
            id: `mentoria-${s.id}`,
            type: 'Mentoria',
            title: `Mentoria com ${s.mentor?.student?.name || 'seu mentor'}`,
            subject: `${formatted} às ${time}`,
            progress: 0,
            to: '/classroom/mentoring',
            color: '#0891b2',
            btnLabel: 'Ver detalhes',
          });
        });
      }

      setResumeItems(items.slice(0, 3));
      setResumeLoaded(true);
    });
  }, []);

  const toggleEvent = async (id: number) => {
    try {
      await api.patch(`/calendar/events/${id}/toggle`);
      setWeekEvents(prev => prev.map(e => e.id === id ? { ...e, done: !e.done } : e));
    } catch { /* ignore */ }
  };

  const weekDone = weekEvents.filter(e => e.done).length;
  const weekTotal = weekEvents.length;

  const isNewUser =
    metricsLoaded && resumeLoaded &&
    metrics.total_answered === 0 &&
    resumeItems.length === 0 &&
    weekEvents.length === 0;

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
          <p>Tudo pronto para mais um dia de estudos?</p>
        </div>

        {visibleAnnouncements.length > 0 && (
          <div className="home-announcements">
            {visibleAnnouncements.map(a => (
              <div key={a.id} className="home-announcement-banner">
                <Megaphone size={16} className="home-announcement-icon" />
                <div className="home-announcement-content">
                  <span className="home-announcement-from">{a.mentor.student.name.replace(/^PROF\.\s*/i, '')}</span>
                  <p>{a.content}</p>
                </div>
                <button
                  className="home-announcement-dismiss"
                  onClick={() => dismissAnnouncement(a.id)}
                  title="Dispensar"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

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
            <div className="metric-progress">
              <div className="metric-progress-fill metric-progress-green" style={{ width: `${metrics.accuracy}%` }} />
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
            <div className="metric-progress">
              <div className="metric-progress-fill metric-progress-orange" style={{ width: `${Math.min(Math.round((metrics.streak / 7) * 100), 100)}%` }} />
            </div>
          </div>
        </div>

        {/* Onboarding — aluno novo sem nenhuma atividade */}
        {isNewUser && (
          <div className="home-onboarding">
            <div className="onboarding-heading">
              <Rocket size={20} />
              <div>
                <h2>Bem-vindo ao VestWeb! Por onde começar?</h2>
                <p>Você ainda não tem nenhuma atividade. Dê o primeiro passo:</p>
              </div>
            </div>
            <div className="onboarding-steps">
              {onboardingSteps.map((step, i) => (
                <div key={i} className="onboarding-step">
                  <div className="onboarding-step-icon" style={{ background: step.color + '18', color: step.color }}>
                    <step.icon size={22} />
                  </div>
                  <div className="onboarding-step-info">
                    <strong>{step.title}</strong>
                    <span>{step.desc}</span>
                  </div>
                  <Link to={step.to} className="onboarding-step-btn" style={{ background: step.color }}>
                    {step.btn}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continuar de onde parou */}
        {!isNewUser && resumeItems.length > 0 && (
          <div className="home-resume">
            <h2 className="home-resume-title">Continuar de onde parou</h2>
            <div className="resume-list">
              {resumeItems.map(item => (
                <div key={item.id} className="resume-card">
                  <div
                    className="resume-card-thumb"
                    style={{
                      background: item.thumbnail ? undefined : item.color + '18',
                      borderColor: item.color + '40',
                    }}
                  >
                    {item.thumbnail
                      ? <img src={item.thumbnail} alt={item.title} />
                      : <span style={{ color: item.color, fontSize: 20 }}>
                          {item.type === 'Videoaula' ? '▶' : item.type === 'Mentoria' ? '🎓' : '📋'}
                        </span>
                    }
                  </div>
                  <div className="resume-card-info">
                    <span className="resume-card-type" style={{ color: item.color }}>{item.type}</span>
                    <span className="resume-card-title">{item.title}</span>
                    <span className="resume-card-subject">{item.subject}</span>
                    {item.type !== 'Mentoria' && (
                      <div className="resume-card-bar-wrap">
                        <div className="resume-card-bar">
                          <div className="resume-card-bar-fill" style={{ width: `${item.progress}%`, background: item.color }} />
                        </div>
                        <span className="resume-card-pct">{item.progress}%</span>
                      </div>
                    )}
                  </div>
                  <Link to={item.to} className="resume-card-btn" style={{ background: item.color }}>
                    {item.btnLabel}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="home-quick-access">
          {quickAccess.map(item => (
            <Link key={item.to} to={item.to} className="quick-access-btn">
              <item.icon size={15} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="home-weekly-goals">
          <div className="weekly-goals-header">
            <div>
              <h2>Metas da semana</h2>
              <p className="weekly-goals-sub">
                {weekTotal === 0
                  ? 'Nenhuma meta cadastrada ainda.'
                  : `${weekDone} de ${weekTotal} concluída${weekTotal > 1 ? 's' : ''}`}
              </p>
            </div>
            {weekTotal > 0 && (
              <div className="weekly-progress-ring" title={`${Math.round((weekDone / weekTotal) * 100)}%`}>
                <svg viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="var(--primary)" strokeWidth="3"
                    strokeDasharray={`${(weekDone / weekTotal) * 100} 100`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <span>{Math.round((weekDone / weekTotal) * 100)}%</span>
              </div>
            )}
          </div>

          {weekTotal === 0 ? (
            <div className="weekly-goals-empty">
              <Link to="/classroom/review-calendar" className="weekly-goals-add">
                <Plus size={14} /> Adicionar meta na Sala de Estudos
              </Link>
            </div>
          ) : (
            <ul className="weekly-goals-list">
              {weekEvents.map(ev => (
                <li key={ev.id} className={`weekly-goal-item${ev.done ? ' done' : ''}`} onClick={() => toggleEvent(ev.id)}>
                  {ev.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  <div className="weekly-goal-info">
                    <span className="weekly-goal-title">{ev.title}</span>
                    <span className="weekly-goal-meta">
                      {new Date(ev.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' })}
                      {ev.start_time && ` · ${ev.start_time.slice(0, 5)}`}
                      {' · '}{ev.type === 'review' ? 'Revisão' : 'Estudo'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
