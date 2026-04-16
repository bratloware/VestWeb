import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { HelpCircle, MessageCircle, CheckCircle, Clock, CalendarDays, AlertCircle, Users, Star, Video, BookOpen, Calendar, PlayCircle, Megaphone, Trash2, Send } from 'lucide-react';
import { RootState } from '../../store/store';
import TeacherSidebar from '../../components/TeacherSidebar';
import api from '../../api/api';
import './TeacherHome.css';

interface ActivityEvent {
  type: 'session' | 'view' | 'comment';
  date: string;
  student: { id: number; name: string; avatar_url: string | null };
  meta: { scheduled_at?: string; status?: string; videoTitle?: string };
}

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
  const { user: student } = useSelector((state: RootState) => state.auth);
  const [questionCount, setQuestionCount] = useState(0);
  const [sessions, setSessions] = useState<SessionSummary>({ total: 0, pending: 0, confirmed: 0, done: 0 });
  const [upcoming, setUpcoming] = useState<UpcomingSession[]>([]);
  interface VideoStat {
    id: number;
    title: string;
    thumbnail_url: string | null;
    status: 'published' | 'scheduled' | 'draft';
    published_at: string | null;
  }
  interface InsightsData {
    pendingDoubts: number;
    activeStudents: number;
    avgRating: string | null;
    ratingCount: number;
    videoStats: { total: number; published: number; scheduled: number; draft: number; recent: VideoStat[] };
  }
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  interface AnnouncementItem { id: number; content: string; created_at: string; expires_at: string | null }
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [announcementSending, setAnnouncementSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, sRes, iRes, aRes, annRes] = await Promise.all([
          api.get('/teacher/questions'),
          api.get('/teacher/sessions'),
          api.get('/teacher/insights'),
          api.get('/teacher/activity'),
          api.get('/teacher/announcements'),
        ]);
        setInsights(iRes.data.data);
        setActivity(aRes.data.data ?? []);
        setAnnouncements(annRes.data.data ?? []);
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

  const handleSendAnnouncement = async () => {
    if (!newAnnouncement.trim() || announcementSending) return;
    setAnnouncementSending(true);
    try {
      const res = await api.post('/teacher/announcements', { content: newAnnouncement.trim() });
      setAnnouncements(prev => [res.data.data, ...prev]);
      setNewAnnouncement('');
    } catch { /* ignore */ }
    finally { setAnnouncementSending(false); }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    try {
      await api.delete(`/teacher/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch { /* ignore */ }
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

          <div className="teacher-quick-actions">
            <Link to="/teacher/VestWebFlix" className="teacher-quick-btn">
              <Video size={16} />
              Nova Aula
            </Link>
            <Link to="/teacher/questions" className="teacher-quick-btn">
              <BookOpen size={16} />
              Criar Questão
            </Link>
            <Link to="/teacher/sessions" className="teacher-quick-btn">
              <Calendar size={16} />
              Abrir Agenda
            </Link>
          </div>

          <div className="teacher-dashboard-grid">

            {/* ── Coluna esquerda ── */}
            <div className="teacher-dashboard-left">

              <div className="teacher-announcements-widget">
                <div className="teacher-announcements-header">
                  <div className="teacher-upcoming-title">
                    <Megaphone size={18} />
                    <h2>Avisos para os alunos</h2>
                  </div>
                  <span className="teacher-announcements-sub">{announcements.length} ativo{announcements.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="teacher-announcements-compose">
                  <textarea
                    className="teacher-announcements-input"
                    placeholder="Ex: Pessoal, amanhã teremos simulado especial às 19h!"
                    value={newAnnouncement}
                    onChange={e => setNewAnnouncement(e.target.value)}
                    rows={3}
                    maxLength={500}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendAnnouncement(); }}
                  />
                  <div className="teacher-announcements-compose-footer">
                    <span className="teacher-announcements-hint">Ctrl+Enter para enviar</span>
                    <button
                      className="teacher-announcements-send"
                      onClick={handleSendAnnouncement}
                      disabled={!newAnnouncement.trim() || announcementSending}
                    >
                      <Send size={14} />
                      {announcementSending ? 'Enviando...' : 'Publicar aviso'}
                    </button>
                  </div>
                </div>

                {announcements.length > 0 && (
                  <ul className="teacher-announcements-list">
                    {announcements.map(a => {
                      const ago = (() => {
                        const diff = Date.now() - new Date(a.created_at).getTime();
                        const mins = Math.floor(diff / 60000);
                        if (mins < 60) return `${mins}min atrás`;
                        const hrs = Math.floor(mins / 60);
                        if (hrs < 24) return `${hrs}h atrás`;
                        return `${Math.floor(hrs / 24)}d atrás`;
                      })();
                      return (
                        <li key={a.id} className="teacher-announcement-item">
                          <div className="teacher-announcement-body">
                            <p>{a.content}</p>
                            <time>{ago}</time>
                          </div>
                          <button
                            className="teacher-announcement-delete"
                            onClick={() => handleDeleteAnnouncement(a.id)}
                            title="Remover aviso"
                          >
                            <Trash2 size={14} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="teacher-upcoming">
                <div className="teacher-upcoming-header">
                  <div className="teacher-upcoming-title">
                    <CalendarDays size={18} />
                    <h2>Próximas sessões</h2>
                  </div>
                  <Link to="/teacher/sessions" className="teacher-upcoming-all">Ver todas</Link>
                </div>

                {upcoming.length === 0 ? (
                  <div className="teacher-upcoming-empty">
                    <CalendarDays size={32} />
                    <p>Nenhuma sessão agendada.</p>
                    <span>Seus horários disponíveis aparecem para os alunos agendarem.</span>
                    <Link to="/teacher/settings" className="teacher-empty-action">
                      <Calendar size={14} />
                      Configurar horários
                    </Link>
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

            {/* ── Coluna direita ── */}
            <div className="teacher-dashboard-right">

              <div className="teacher-insights">
                <div className="teacher-insights-header">
                  <h2>Impacto</h2>
                  <span>Engajamento dos seus alunos</span>
                </div>
                <div className="teacher-insights-cards">
                  <div className="teacher-insight-card insight-red">
                    <div className="teacher-insight-icon"><AlertCircle size={22} /></div>
                    <div className="teacher-insight-body">
                      <span className="teacher-insight-number">{insights?.pendingDoubts ?? '--'}</span>
                      <span className="teacher-insight-label">Dúvidas pendentes</span>
                    </div>
                  </div>
                  <div className="teacher-insight-card insight-blue">
                    <div className="teacher-insight-icon"><Users size={22} /></div>
                    <div className="teacher-insight-body">
                      <span className="teacher-insight-number">{insights?.activeStudents ?? '--'}</span>
                      <span className="teacher-insight-label">Alunos ativos (24h)</span>
                    </div>
                  </div>
                  <div className="teacher-insight-card insight-yellow">
                    <div className="teacher-insight-icon"><Star size={22} /></div>
                    <div className="teacher-insight-body">
                      <span className="teacher-insight-number">
                        {insights?.avgRating ?? '--'}
                        {insights?.avgRating && <small>/5</small>}
                      </span>
                      <span className="teacher-insight-label">
                        Avaliação média{insights?.ratingCount ? ` (${insights.ratingCount} sessões)` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="teacher-content-widget">
                <div className="teacher-content-header">
                  <div className="teacher-upcoming-title">
                    <PlayCircle size={18} />
                    <h2>Gestão de Conteúdo</h2>
                  </div>
                  <Link to="/teacher/VestWebFlix" className="teacher-upcoming-all">Gerenciar</Link>
                </div>

                <div className="teacher-content-counters">
                  <div className="teacher-content-counter">
                    <span className="tcounter-num">{insights?.videoStats.total ?? '--'}</span>
                    <span className="tcounter-label">Total</span>
                  </div>
                  <div className="teacher-content-counter counter-green">
                    <span className="tcounter-num">{insights?.videoStats.published ?? '--'}</span>
                    <span className="tcounter-label">Disponíveis</span>
                  </div>
                  <div className="teacher-content-counter counter-orange">
                    <span className="tcounter-num">{insights?.videoStats.scheduled ?? '--'}</span>
                    <span className="tcounter-label">Agendadas</span>
                  </div>
                  <div className="teacher-content-counter counter-gray">
                    <span className="tcounter-num">{insights?.videoStats.draft ?? '--'}</span>
                    <span className="tcounter-label">Rascunhos</span>
                  </div>
                </div>

                {insights?.videoStats.recent && insights.videoStats.recent.length > 0 && (
                  <ul className="teacher-content-list">
                    {insights.videoStats.recent.map(v => {
                      const statusLabel = v.status === 'published' ? 'Disponível'
                        : v.status === 'scheduled' ? `Agendada · ${new Date(v.published_at!).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`
                        : 'Rascunho';
                      return (
                        <li key={v.id} className="teacher-content-item">
                          <div className="teacher-content-thumb">
                            {v.thumbnail_url
                              ? <img src={v.thumbnail_url} alt={v.title} />
                              : <Video size={16} />
                            }
                          </div>
                          <span className="teacher-content-title">{v.title}</span>
                          <span className={`teacher-content-badge status-${v.status}`}>{statusLabel}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="teacher-activity">
                <div className="teacher-upcoming-header">
                  <div className="teacher-upcoming-title">
                    <Clock size={18} />
                    <h2>Atividade recente</h2>
                  </div>
                </div>

                {activity.length === 0 ? (
                  <div className="teacher-upcoming-empty">
                    <Users size={32} />
                    <p>Nenhuma atividade ainda.</p>
                    <span>Publique uma aula para começar a receber engajamento.</span>
                    <Link to="/teacher/VestWebFlix" className="teacher-empty-action">
                      <Video size={14} />
                      Publicar aula
                    </Link>
                  </div>
                ) : (
                  <ul className="teacher-activity-list">
                    {activity.map((event, i) => {
                      const firstName = event.student.name.split(' ')[0];
                      let text = '';
                      if (event.type === 'session') {
                        const d = new Date(event.meta.scheduled_at!);
                        const isToday = d.toDateString() === new Date().toDateString();
                        const isTomorrow = d.toDateString() === new Date(Date.now() + 86400000).toDateString();
                        const when = isToday ? 'para hoje' : isTomorrow ? 'para amanhã' : `para ${d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`;
                        text = `agendou uma mentoria ${when}`;
                      } else if (event.type === 'view') {
                        text = `assistiu "${event.meta.videoTitle}"`;
                      } else {
                        text = 'comentou em uma publicação sua';
                      }

                      const timeAgo = (() => {
                        const diff = Date.now() - new Date(event.date).getTime();
                        const mins = Math.floor(diff / 60000);
                        if (mins < 60) return `${mins}min atrás`;
                        const hrs = Math.floor(mins / 60);
                        if (hrs < 24) return `${hrs}h atrás`;
                        return `${Math.floor(hrs / 24)}d atrás`;
                      })();

                      return (
                        <li key={i} className="teacher-activity-item">
                          <div className="teacher-upcoming-avatar">
                            {event.student.avatar_url
                              ? <img src={event.student.avatar_url} alt={event.student.name} />
                              : getInitials(event.student.name)
                            }
                          </div>
                          <div className="teacher-activity-text">
                            <span><strong>{firstName}</strong> {text}</span>
                            <time>{timeAgo}</time>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherHome;
