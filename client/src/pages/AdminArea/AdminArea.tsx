import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard, Users, GraduationCap, Play, BookOpen,
  Search, UserPlus, Eye, EyeOff, TrendingUp, Video as VideoIcon,
  HelpCircle, Calendar, CreditCard, Clock, ToggleLeft, ToggleRight,
  KeyRound, ChevronDown, Check, X, UserCheck, Flag, CheckCircle, XCircle,
  ShieldCheck, Pencil, Save, AlertCircle,
} from 'lucide-react';
import TeacherSidebar from '../../components/TeacherSidebar';
import api from '../../api/api';
import './AdminArea.css';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Stats {
  totalStudents: number; totalTeachers: number; totalVideos: number;
  publishedVideos: number; totalQuestions: number; weeklyLogins: number; newStudentsThisWeek: number;
}

interface StudentItem {
  id: number; name: string; email: string; enrollment: string;
  role: string; active: boolean; avatar_url: string | null; created_at: string;
}

interface TeacherItem {
  id: number; name: string; email: string; enrollment: string;
  bio: string | null; avatar_url: string | null; created_at: string;
}

interface VideoItem {
  id: number; title: string; thumbnail_url: string | null; published_at: string | null; created_at: string;
}

interface Vestibular { id: number; name: string; full_name: string; institution: string; state: string; }

interface Subscription {
  id: number; customer_name: string; customer_email: string; plan_tier: string;
  billing_period: string; status: string; current_period_end: string | null; created_at: string;
}

interface PendingItem {
  id: number; name: string; email: string; created_at: string; stripe_session_id: string;
}

interface AdminItem {
  id: number; name: string; email: string; enrollment: string;
  active: boolean; avatar_url: string | null; created_at: string;
}

interface QuestionReportItem {
  id: number;
  question_id: number;
  error_type: string;
  description: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  student: { id: number; name: string; email: string; enrollment: string } | null;
  question: { id: number; statement: string } | null;
}

type Tab = 'overview' | 'students' | 'teachers' | 'videos' | 'vestibulares' | 'subscriptions' | 'pending' | 'reports' | 'admins';

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview',       label: 'Visão Geral',  icon: LayoutDashboard },
  { id: 'students',       label: 'Alunos',        icon: Users },
  { id: 'teachers',       label: 'Professores',   icon: GraduationCap },
  { id: 'subscriptions',  label: 'Assinaturas',   icon: CreditCard },
  { id: 'pending',        label: 'Pendentes',     icon: Clock },
  { id: 'videos',         label: 'VestWebFlix',   icon: Play },
  { id: 'vestibulares',   label: 'Cursinhos',     icon: BookOpen },
  { id: 'reports',        label: 'Reportes',      icon: Flag },
  { id: 'admins',         label: 'Administradores', icon: ShieldCheck },
];

const EMPTY_FORM = { name: '', email: '', enrollment: '', password: '', bio: '', specialty: '' };

// ── Helpers ────────────────────────────────────────────────────────────────────

const avatarEl = (name: string, url: string | null) => (
  <div className="admin-list-avatar">
    {url ? <img src={url} alt={name} /> : name.charAt(0).toUpperCase()}
  </div>
);

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

const videoStatus = (published_at: string | null): 'published' | 'scheduled' | 'draft' => {
  if (!published_at) return 'draft';
  return new Date(published_at) > new Date() ? 'scheduled' : 'published';
};
const STATUS_LABELS = { published: 'Publicado', scheduled: 'Agendado', draft: 'Rascunho' };

const SUB_STATUS_COLOR: Record<string, string> = {
  active: '#16a34a', trialing: '#2563eb', past_due: '#d97706', canceled: '#dc2626', incomplete: '#9ca3af',
};
const SUB_STATUS_LABEL: Record<string, string> = {
  active: 'Ativo', trialing: 'Trial', past_due: 'Vencido', canceled: 'Cancelado', incomplete: 'Incompleto',
};

// ── Feedback banner ────────────────────────────────────────────────────────────

const Feedback = ({ msg, type }: { msg: string; type: 'success' | 'error' }) => (
  <div className={`admin-feedback admin-feedback-${type}`}>{msg}</div>
);

// ── Stat card ──────────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, value, label, sub, color }: {
  icon: typeof LayoutDashboard; value: number | string; label: string; sub?: string; color: string;
}) => (
  <div className="admin-stat-card">
    <div className="admin-stat-icon" style={{ background: color + '1a' }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <div className="admin-stat-value">{value}</div>
      <div className="admin-stat-label">{label}</div>
      {sub && <div className="admin-stat-sub">{sub}</div>}
    </div>
  </div>
);

// ── Role dropdown ──────────────────────────────────────────────────────────────

const ROLE_OPTS = ['student', 'teacher', 'admin'] as const;
const ROLE_LABELS: Record<string, string> = { student: 'Aluno', teacher: 'Professor', admin: 'Admin' };

const RoleDropdown = ({ value, onChange }: { value: string; onChange: (r: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className={`admin-badge admin-badge-${value}`}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, border: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        {ROLE_LABELS[value] ?? value}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 50,
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: 110,
        }}>
          {ROLE_OPTS.map(r => (
            <button
              key={r}
              onClick={() => { onChange(r); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '9px 14px', border: 'none', background: r === value ? 'var(--bg-secondary)' : 'transparent',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text)', textAlign: 'left',
              }}
            >
              {r === value && <Check size={12} color="var(--primary)" />}
              {r !== value && <span style={{ width: 12 }} />}
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Reset password modal ───────────────────────────────────────────────────────

const ResetModal = ({ student, onClose }: { student: StudentItem; onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/auth/students/${student.id}/reset-password`);
      setResult(res.data.data.temp_password);
    } catch { setResult(null); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16,
        padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <KeyRound size={18} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Redefinir senha</h3>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Gerar senha temporária para <strong style={{ color: 'var(--text)' }}>{student.name}</strong>. Todas as sessões ativas serão encerradas.
        </p>
        {result ? (
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginBottom: 6 }}>Senha temporária gerada:</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'monospace', letterSpacing: 1 }}>{result}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>Copie e envie ao aluno. Oriente-o a alterar a senha após o login.</div>
          </div>
        ) : (
          <button
            onClick={handleReset} disabled={loading}
            className="admin-submit-btn" style={{ width: '100%', marginBottom: 12 }}
          >
            <KeyRound size={15} />
            {loading ? 'Gerando...' : 'Gerar senha temporária'}
          </button>
        )}
        <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          Fechar
        </button>
      </div>
    </div>
  );
};

// ── Overview ───────────────────────────────────────────────────────────────────

const Overview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/stats').then(r => setStats(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div>
      <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
        {[1,2,3,4].map(i => <div key={i} className="sk" style={{ height: 110 }} />)}
      </div>
      <div className="admin-overview-row">
        {[1,2].map(i => <div key={i} className="sk" style={{ height: 120 }} />)}
      </div>
    </div>
  );
  if (!stats) return null;

  return (
    <div>
      <div className="admin-stats-grid">
        <StatCard icon={Users}         value={stats.totalStudents}   label="Alunos cadastrados"    sub={`+${stats.newStudentsThisWeek} essa semana`} color="#6366f1" />
        <StatCard icon={GraduationCap} value={stats.totalTeachers}   label="Professores"                                                             color="#3b82f6" />
        <StatCard icon={VideoIcon}     value={stats.publishedVideos} label="Vídeos publicados"      sub={`${stats.totalVideos} total`}               color="#ef4444" />
        <StatCard icon={HelpCircle}    value={stats.totalQuestions}  label="Questões no banco"                                                       color="#f59e0b" />
      </div>
      <div className="admin-overview-row">
        <div className="admin-card">
          <div className="admin-card-title"><TrendingUp size={18} color="var(--primary)" /><h2>Acessos semanais</h2></div>
          <div className="admin-highlight-num">{stats.weeklyLogins}</div>
          <div className="admin-highlight-label">logins nos últimos 7 dias</div>
        </div>
        <div className="admin-card">
          <div className="admin-card-title"><Calendar size={18} color="#22c55e" /><h2>Novos alunos (7 dias)</h2></div>
          <div className="admin-highlight-num" style={{ color: '#22c55e' }}>{stats.newStudentsThisWeek}</div>
          <div className="admin-highlight-label">matrículas na última semana</div>
        </div>
      </div>
    </div>
  );
};

// ── Students ───────────────────────────────────────────────────────────────────

const Students = () => {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resetTarget, setResetTarget] = useState<StudentItem | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    api.get('/auth/students').then(r => setStudents(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const showMsg = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const patch = useCallback(async (id: number, body: object) => {
    try {
      const res = await api.patch(`/auth/students/${id}`, body);
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...res.data.data } : s));
    } catch (err: any) {
      showMsg('error', err.response?.data?.message ?? 'Erro ao atualizar.');
    }
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.enrollment.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-card">
      {resetTarget && <ResetModal student={resetTarget} onClose={() => setResetTarget(null)} />}

      <div className="admin-card-title">
        <Users size={18} color="var(--primary)" />
        <h2>Alunos cadastrados</h2>
        <span className="admin-count">{students.length} total</span>
      </div>

      {feedback && <Feedback type={feedback.type} msg={feedback.msg} />}

      <div className="admin-search">
        <Search size={16} color="var(--text-secondary)" />
        <input placeholder="Buscar por nome, e-mail ou matrícula..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="sk" style={{ height: 66 }} />)}
        </div>
      ) : (
        <div className="admin-list">
          {filtered.length === 0
            ? <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>Nenhum aluno encontrado.</p>
            : filtered.map(s => (
              <div key={s.id} className="admin-list-item" style={{ opacity: s.active ? 1 : 0.55 }}>
                {avatarEl(s.name, s.avatar_url)}
                <div className="admin-list-info">
                  <div className="admin-list-name">{s.name}</div>
                  <div className="admin-list-sub">{s.enrollment} · {s.email}</div>
                </div>

                {/* Role dropdown */}
                <RoleDropdown value={s.role} onChange={role => patch(s.id, { role })} />

                {/* Reset password */}
                <button
                  className="admin-action-btn"
                  title="Redefinir senha"
                  onClick={() => setResetTarget(s)}
                >
                  <KeyRound size={14} />
                </button>

                {/* Active toggle */}
                <button
                  className="admin-action-btn"
                  title={s.active ? 'Desativar conta' : 'Ativar conta'}
                  style={{ color: s.active ? '#16a34a' : '#dc2626' }}
                  onClick={() => patch(s.id, { active: !s.active })}
                >
                  {s.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>

                <div className="admin-list-meta">{fmtDate(s.created_at)}</div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
};

// ── Teachers ───────────────────────────────────────────────────────────────────

const Teachers = () => {
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/auth/teachers').then(r => setTeachers(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const showMsg = (type: 'success' | 'error', msg: string) => { setFeedback({ type, msg }); setTimeout(() => setFeedback(null), 4000); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.enrollment || !form.password) { showMsg('error', 'Preencha todos os campos obrigatórios.'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/auth/teachers', form);
      setTeachers(prev => [res.data.data.teacher, ...prev]);
      setForm(EMPTY_FORM);
      showMsg('success', `Professor "${res.data.data.teacher.name}" criado!`);
    } catch (err: any) { showMsg('error', err.response?.data?.message ?? 'Erro ao criar professor.'); }
    finally { setSubmitting(false); }
  };

  const filtered = teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.enrollment.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="admin-teachers-grid">
      <div className="admin-card">
        <div className="admin-card-title"><GraduationCap size={18} color="var(--primary)" /><h2>Professores</h2><span className="admin-count">{teachers.length} cadastrado{teachers.length !== 1 ? 's' : ''}</span></div>
        <div className="admin-search"><Search size={16} color="var(--text-secondary)" /><input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[1,2,3].map(i => <div key={i} className="sk" style={{ height: 62 }} />)}</div>
        ) : (
          <div className="admin-list">
            {filtered.map(t => (
              <div key={t.id} className="admin-list-item">
                {avatarEl(t.name, t.avatar_url)}
                <div className="admin-list-info"><div className="admin-list-name">{t.name}</div><div className="admin-list-sub">{t.enrollment} · {t.email}</div></div>
                <div className="admin-list-meta">{fmtDate(t.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="admin-card">
        <div className="admin-card-title"><UserPlus size={18} color="var(--primary)" /><h2>Novo professor</h2></div>
        {feedback && <Feedback type={feedback.type} msg={feedback.msg} />}
        <form className="admin-form" onSubmit={handleSubmit}>
          {([
            { id: 'name', label: 'Nome completo *', type: 'text', ph: 'Prof. Nome Sobrenome' },
            { id: 'email', label: 'E-mail *', type: 'email', ph: 'prof@escola.com' },
            { id: 'enrollment', label: 'Matrícula *', type: 'text', ph: 'TCH009' },
            { id: 'specialty', label: 'Especialidade', type: 'text', ph: 'Biologia, Química...' },
          ] as { id: keyof typeof EMPTY_FORM; label: string; type: string; ph: string }[]).map(f => (
            <div key={f.id} className="admin-form-group">
              <label className="admin-form-label" htmlFor={f.id}>{f.label}</label>
              <input id={f.id} type={f.type} placeholder={f.ph} value={form[f.id]} onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))} className="admin-form-input" />
            </div>
          ))}
          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="bio">Bio</label>
            <textarea id="bio" placeholder="Breve descrição..." value={form.bio} rows={3} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} className="admin-form-textarea" />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="password">Senha inicial *</label>
            <div className="admin-pw-wrap">
              <input id="password" type={showPw ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="admin-form-input" />
              <button type="button" className="admin-pw-toggle" onClick={() => setShowPw(p => !p)}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <button type="submit" className="admin-submit-btn" disabled={submitting}><UserPlus size={16} />{submitting ? 'Criando...' : 'Criar professor'}</button>
        </form>
      </div>
    </div>
  );
};

// ── Subscriptions ──────────────────────────────────────────────────────────────

const Subscriptions = () => {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/auth/subscriptions').then(r => setSubs(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = subs.filter(s =>
    s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.customer_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-card">
      <div className="admin-card-title">
        <CreditCard size={18} color="var(--primary)" />
        <h2>Assinaturas</h2>
        <span className="admin-count">{subs.length} total</span>
      </div>

      <div className="admin-search">
        <Search size={16} color="var(--text-secondary)" />
        <input placeholder="Buscar por nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="sk" style={{ height: 70 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>
          {subs.length === 0 ? 'Nenhuma assinatura registrada.' : 'Nenhum resultado.'}
        </p>
      ) : (
        <div className="admin-list">
          {filtered.map(s => {
            const color = SUB_STATUS_COLOR[s.status] ?? '#9ca3af';
            return (
              <div key={s.id} className="admin-list-item">
                <div className="admin-list-avatar" style={{ background: color + '22', color }}>
                  <CreditCard size={16} />
                </div>
                <div className="admin-list-info">
                  <div className="admin-list-name">{s.customer_name || s.customer_email}</div>
                  <div className="admin-list-sub">
                    {s.customer_email} · {s.plan_tier} ({s.billing_period})
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: color + '1a', color }}>
                    {SUB_STATUS_LABEL[s.status] ?? s.status}
                  </span>
                  {s.current_period_end && (
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      Vence {fmtDate(s.current_period_end)}
                    </span>
                  )}
                </div>
                <div className="admin-list-meta">{fmtDate(s.created_at)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Pending students ───────────────────────────────────────────────────────────

const Pending = () => {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    api.get('/auth/pending').then(r => setPending(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const showMsg = (type: 'success' | 'error', msg: string) => { setFeedback({ type, msg }); setTimeout(() => setFeedback(null), 5000); };

  const approve = async (id: number) => {
    setActing(id);
    try {
      await api.post(`/auth/pending/${id}/approve`);
      setPending(prev => prev.filter(p => p.id !== id));
      showMsg('success', 'Aluno aprovado e conta criada com sucesso!');
    } catch (err: any) { showMsg('error', err.response?.data?.message ?? 'Erro ao aprovar.'); }
    finally { setActing(null); }
  };

  const reject = async (id: number) => {
    setActing(id);
    try {
      await api.delete(`/auth/pending/${id}`);
      setPending(prev => prev.filter(p => p.id !== id));
      showMsg('success', 'Aluno removido da fila.');
    } catch { showMsg('error', 'Erro ao rejeitar.'); }
    finally { setActing(null); }
  };

  return (
    <div className="admin-card">
      <div className="admin-card-title">
        <Clock size={18} color="#f59e0b" />
        <h2>Fila de aprovação</h2>
        <span className="admin-count">{pending.length} pendente{pending.length !== 1 ? 's' : ''}</span>
      </div>

      {feedback && <Feedback type={feedback.type} msg={feedback.msg} />}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="sk" style={{ height: 66 }} />)}
        </div>
      ) : pending.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <UserCheck size={40} color="var(--text-secondary)" style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Nenhum aluno aguardando aprovação.</p>
        </div>
      ) : (
        <div className="admin-list">
          {pending.map(p => (
            <div key={p.id} className="admin-list-item">
              <div className="admin-list-avatar" style={{ background: 'rgba(245,158,11,0.15)', color: '#d97706' }}>
                {p.name.charAt(0).toUpperCase()}
              </div>
              <div className="admin-list-info">
                <div className="admin-list-name">{p.name}</div>
                <div className="admin-list-sub">{p.email} · sessão {p.stripe_session_id.slice(-8)}</div>
              </div>
              <div className="admin-list-meta" style={{ marginRight: 8 }}>{fmtDateTime(p.created_at)}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="admin-pending-btn admin-pending-btn-approve"
                  disabled={acting === p.id}
                  onClick={() => approve(p.id)}
                  title="Aprovar"
                >
                  <Check size={14} />
                  Aprovar
                </button>
                <button
                  className="admin-pending-btn admin-pending-btn-reject"
                  disabled={acting === p.id}
                  onClick={() => reject(p.id)}
                  title="Rejeitar"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── VestWebFlix ────────────────────────────────────────────────────────────────

const Videos = () => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    api.get('/videos').then(r => setVideos(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const togglePublish = useCallback(async (v: VideoItem) => {
    setToggling(v.id);
    const status = videoStatus(v.published_at);
    const newPublishedAt = status === 'published' ? null : new Date().toISOString();
    try {
      await api.put(`/videos/${v.id}`, { title: v.title, thumbnail_url: v.thumbnail_url, published_at: newPublishedAt });
      setVideos(prev => prev.map(x => x.id === v.id ? { ...x, published_at: newPublishedAt } : x));
    } catch { /* ignore */ }
    finally { setToggling(null); }
  }, []);

  const filtered = videos.filter(v => v.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="admin-card">
      <div className="admin-card-title"><Play size={18} color="#ef4444" /><h2>VestWebFlix — Aulas</h2><span className="admin-count">{videos.length} vídeos</span></div>
      <div className="admin-search"><Search size={16} color="var(--text-secondary)" /><input placeholder="Buscar vídeo..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      {loading ? (
        <div className="admin-video-grid">{[1,2,3,4,5,6].map(i => <div key={i} className="sk" style={{ height: 200 }} />)}</div>
      ) : (
        <div className="admin-video-grid">
          {filtered.map(v => {
            const status = videoStatus(v.published_at);
            return (
              <div key={v.id} className="admin-video-card">
                {v.thumbnail_url
                  ? <img src={v.thumbnail_url} alt={v.title} className="admin-video-thumb" loading="lazy" />
                  : <div className="admin-video-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><VideoIcon size={32} color="var(--text-secondary)" /></div>
                }
                <div className="admin-video-body">
                  <div className="admin-video-title">{v.title}</div>
                  <div className="admin-video-footer">
                    <span className={`admin-video-status admin-video-status-${status}`}>{STATUS_LABELS[status]}</span>
                    <button className="admin-toggle-btn" disabled={toggling === v.id} onClick={() => togglePublish(v)}>
                      {toggling === v.id ? '...' : status === 'published' ? 'Despublicar' : 'Publicar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Vestibulares ───────────────────────────────────────────────────────────────

const Vestibulares = () => {
  const [list, setList] = useState<Vestibular[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/questions/vestibulares').then(r => setList(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-card">
      <div className="admin-card-title"><BookOpen size={18} color="var(--primary)" /><h2>Vestibulares / Cursinhos</h2><span className="admin-count">{list.length} cadastrados</span></div>
      {loading ? (
        <div className="admin-vest-grid">{[1,2,3,4,5,6].map(i => <div key={i} className="sk" style={{ height: 90 }} />)}</div>
      ) : (
        <div className="admin-vest-grid">
          {list.map(v => (
            <div key={v.id} className="admin-vest-card">
              <div className="admin-vest-name">{v.name}</div>
              <div className="admin-vest-full">{v.full_name}</div>
              <div className="admin-vest-tags">
                {v.institution && <span className="admin-vest-tag">{v.institution}</span>}
                {v.state && <span className="admin-vest-tag">{v.state}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Question Reports ──────────────────────────────────────────────────────────

const ERROR_TYPE_LABELS: Record<string, string> = {
  wrong_answer:       'Gabarito incorreto',
  typo:               'Erro de digitação/ortografia',
  image_missing:      'Imagem ausente ou corrompida',
  unclear_statement:  'Enunciado confuso ou incompleto',
  wrong_subject:      'Disciplina/assunto incorreto',
  other:              'Outro',
};

const REPORT_STATUS_COLOR: Record<string, string> = {
  pending:   '#d97706',
  resolved:  '#16a34a',
  dismissed: '#9ca3af',
};

const REPORT_STATUS_LABEL: Record<string, string> = {
  pending:   'Pendente',
  resolved:  'Resolvido',
  dismissed: 'Descartado',
};

const QuestionReports = () => {
  const [reports, setReports] = useState<QuestionReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');

  useEffect(() => {
    api.get('/auth/question-reports').then(r => setReports(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const resolve = async (id: number, status: 'resolved' | 'dismissed') => {
    setActing(id);
    try {
      const res = await api.patch(`/auth/question-reports/${id}`, { status });
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: res.data.data.status } : r));
    } catch { /* ignore */ }
    finally { setActing(null); }
  };

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);
  const pendingCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="admin-card">
      <div className="admin-card-title">
        <Flag size={18} color="#ef4444" />
        <h2>Reportes de questões</h2>
        <span className="admin-count">{reports.length} total · {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}</span>
      </div>

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', 'pending', 'resolved', 'dismissed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: `1.5px solid ${filter === f ? 'var(--primary)' : 'var(--border)'}`,
              background: filter === f ? 'rgba(99,102,241,0.1)' : 'transparent',
              color: filter === f ? 'var(--primary)' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {{ all: 'Todos', pending: 'Pendentes', resolved: 'Resolvidos', dismissed: 'Descartados' }[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1,2,3].map(i => <div key={i} className="sk" style={{ height: 100 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Flag size={40} color="var(--text-secondary)" style={{ marginBottom: 12, opacity: 0.35 }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Nenhum reporte encontrado.</p>
        </div>
      ) : (
        <div className="admin-list" style={{ maxHeight: 620 }}>
          {filtered.map(r => {
            const statusColor = REPORT_STATUS_COLOR[r.status] ?? '#9ca3af';
            return (
              <div key={r.id} className="admin-list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%' }}>
                  <div className="admin-list-avatar" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', flexShrink: 0 }}>
                    <Flag size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span className="admin-list-name">
                        {ERROR_TYPE_LABELS[r.error_type] ?? r.error_type}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
                        background: statusColor + '1a', color: statusColor,
                      }}>
                        {REPORT_STATUS_LABEL[r.status]}
                      </span>
                    </div>
                    {r.student && (
                      <div className="admin-list-sub">
                        Aluno: {r.student.name} ({r.student.enrollment})
                      </div>
                    )}
                    {r.question && (
                      <div className="admin-list-sub" style={{ marginTop: 2 }}>
                        Questão #{r.question_id}: {r.question.statement.slice(0, 80)}{r.question.statement.length > 80 ? '...' : ''}
                      </div>
                    )}
                    {r.description && (
                      <div style={{
                        marginTop: 8, padding: '8px 12px', borderRadius: 8,
                        background: 'var(--bg)', border: '1px solid var(--border)',
                        fontSize: 13, color: 'var(--text)', lineHeight: 1.5,
                      }}>
                        {r.description}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {fmtDateTime(r.created_at)}
                  </div>
                </div>

                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8, paddingLeft: 50 }}>
                    <button
                      className="admin-pending-btn admin-pending-btn-approve"
                      disabled={acting === r.id}
                      onClick={() => resolve(r.id, 'resolved')}
                    >
                      <CheckCircle size={14} />
                      Marcar resolvido
                    </button>
                    <button
                      className="admin-pending-btn admin-pending-btn-reject"
                      disabled={acting === r.id}
                      onClick={() => resolve(r.id, 'dismissed')}
                      style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <XCircle size={14} />
                      Descartar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Admin Management ──────────────────────────────────────────────────────────

const EMPTY_ADMIN_FORM = { name: '', email: '', enrollment: '', password: '' };

interface EditState {
  name: string; email: string; enrollment: string; new_password: string;
}

const AdminManagement = () => {
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_ADMIN_FORM);
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Edit state per admin
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditState>({ name: '', email: '', enrollment: '', new_password: '' });
  const [editShowPw, setEditShowPw] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  // Reset modal
  const [resetTarget, setResetTarget] = useState<AdminItem | null>(null);

  useEffect(() => {
    api.get('/auth/admins').then(r => setAdmins(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const showMsg = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.enrollment || !form.password) {
      showMsg('error', 'Preencha todos os campos obrigatórios.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post('/auth/admins', form);
      setAdmins(prev => [...prev, res.data.data]);
      setForm(EMPTY_ADMIN_FORM);
      showMsg('success', `Administrador "${res.data.data.name}" criado com sucesso!`);
    } catch (err: any) {
      showMsg('error', err.response?.data?.message ?? 'Erro ao criar administrador.');
    } finally { setSubmitting(false); }
  };

  const startEdit = (a: AdminItem) => {
    setEditingId(a.id);
    setEditForm({ name: a.name, email: a.email, enrollment: a.enrollment, new_password: '' });
    setEditShowPw(false);
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({ name: '', email: '', enrollment: '', new_password: '' }); };

  const handleSaveEdit = async (id: number) => {
    setEditSaving(true);
    try {
      const body: Record<string, string> = {
        name: editForm.name,
        email: editForm.email,
        enrollment: editForm.enrollment,
      };
      if (editForm.new_password) body.new_password = editForm.new_password;
      const res = await api.patch(`/auth/admins/${id}`, body);
      setAdmins(prev => prev.map(a => a.id === id ? { ...a, ...res.data.data } : a));
      cancelEdit();
      showMsg('success', 'Credenciais atualizadas.');
    } catch (err: any) {
      showMsg('error', err.response?.data?.message ?? 'Erro ao salvar.');
    } finally { setEditSaving(false); }
  };

  const toggleActive = async (a: AdminItem) => {
    try {
      const res = await api.patch(`/auth/admins/${a.id}`, { active: !a.active });
      setAdmins(prev => prev.map(x => x.id === a.id ? { ...x, active: res.data.data.active } : x));
    } catch (err: any) {
      showMsg('error', err.response?.data?.message ?? 'Erro ao atualizar.');
    }
  };

  return (
    <div className="admin-teachers-grid">
      {/* ── Admin list ── */}
      <div className="admin-card">
        <div className="admin-card-title">
          <ShieldCheck size={18} color="var(--primary)" />
          <h2>Administradores</h2>
          <span className="admin-count">{admins.length} cadastrado{admins.length !== 1 ? 's' : ''}</span>
        </div>

        {feedback && <Feedback type={feedback.type} msg={feedback.msg} />}

        {/* Reset password modal */}
        {resetTarget && <ResetAdminModal admin={resetTarget} onClose={() => setResetTarget(null)} />}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map(i => <div key={i} className="sk" style={{ height: 80 }} />)}
          </div>
        ) : admins.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '32px 0', fontSize: 14 }}>
            Nenhum administrador cadastrado.
          </p>
        ) : (
          <div className="admin-list">
            {admins.map(a => (
              <div key={a.id} style={{ opacity: a.active ? 1 : 0.55 }}>
                {editingId === a.id ? (
                  /* ── Edit card ── */
                  <div style={{
                    padding: '14px', background: 'var(--bg-secondary)',
                    border: '1.5px solid var(--primary)', borderRadius: 12,
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <Pencil size={14} color="var(--primary)" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>Editando credenciais</span>
                      <button onClick={cancelEdit} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}>
                        <X size={16} />
                      </button>
                    </div>

                    {[
                      { id: 'edit-name', label: 'Nome', value: editForm.name, field: 'name' as keyof EditState },
                      { id: 'edit-email', label: 'E-mail', value: editForm.email, field: 'email' as keyof EditState },
                      { id: 'edit-enrollment', label: 'Matrícula', value: editForm.enrollment, field: 'enrollment' as keyof EditState },
                    ].map(f => (
                      <div key={f.id} className="admin-form-group">
                        <label className="admin-form-label" htmlFor={f.id + '-' + a.id}>{f.label}</label>
                        <input
                          id={f.id + '-' + a.id}
                          type={f.field === 'email' ? 'email' : 'text'}
                          className="admin-form-input"
                          value={f.value}
                          onChange={e => setEditForm(prev => ({ ...prev, [f.field]: e.target.value }))}
                        />
                      </div>
                    ))}

                    <div className="admin-form-group">
                      <label className="admin-form-label" htmlFor={`edit-pw-${a.id}`}>
                        Nova senha <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(deixe em branco para manter)</span>
                      </label>
                      <div className="admin-pw-wrap">
                        <input
                          id={`edit-pw-${a.id}`}
                          type={editShowPw ? 'text' : 'password'}
                          className="admin-form-input"
                          placeholder="Mínimo 6 caracteres"
                          value={editForm.new_password}
                          onChange={e => setEditForm(prev => ({ ...prev, new_password: e.target.value }))}
                        />
                        <button type="button" className="admin-pw-toggle" onClick={() => setEditShowPw(v => !v)}>
                          {editShowPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      className="admin-submit-btn"
                      onClick={() => handleSaveEdit(a.id)}
                      disabled={editSaving}
                    >
                      <Save size={15} />
                      {editSaving ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                  </div>
                ) : (
                  /* ── Normal row ── */
                  <div className="admin-list-item">
                    {avatarEl(a.name, a.avatar_url)}
                    <div className="admin-list-info">
                      <div className="admin-list-name">{a.name}</div>
                      <div className="admin-list-sub">{a.enrollment} · {a.email}</div>
                    </div>

                    {/* Edit credentials */}
                    <button className="admin-action-btn" title="Editar credenciais" onClick={() => startEdit(a)}>
                      <Pencil size={14} />
                    </button>

                    {/* Reset password */}
                    <button className="admin-action-btn" title="Redefinir senha" onClick={() => setResetTarget(a)}>
                      <KeyRound size={14} />
                    </button>

                    {/* Toggle active */}
                    <button
                      className="admin-action-btn"
                      title={a.active ? 'Desativar conta' : 'Ativar conta'}
                      style={{ color: a.active ? '#16a34a' : '#dc2626' }}
                      onClick={() => toggleActive(a)}
                    >
                      {a.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>

                    <div className="admin-list-meta">{fmtDate(a.created_at)}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create admin form ── */}
      <div className="admin-card">
        <div className="admin-card-title">
          <UserPlus size={18} color="var(--primary)" />
          <h2>Novo administrador</h2>
        </div>

        <div style={{
          padding: '12px 14px', borderRadius: 10, marginBottom: 20,
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <AlertCircle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: '#92400e', margin: 0, lineHeight: 1.5 }}>
            Administradores têm acesso total ao painel. Crie credenciais apenas para pessoas de confiança e use senhas fortes.
          </p>
        </div>

        <form className="admin-form" onSubmit={handleCreate}>
          {([
            { id: 'adm-name', label: 'Nome completo *', field: 'name' as keyof typeof form, type: 'text', ph: 'Nome do administrador' },
            { id: 'adm-email', label: 'E-mail *', field: 'email' as keyof typeof form, type: 'email', ph: 'admin@vestvest.com' },
            { id: 'adm-enrollment', label: 'Matrícula / Login *', field: 'enrollment' as keyof typeof form, type: 'text', ph: 'ex: adminjoao' },
          ] as { id: string; label: string; field: keyof typeof form; type: string; ph: string }[]).map(f => (
            <div key={f.id} className="admin-form-group">
              <label className="admin-form-label" htmlFor={f.id}>{f.label}</label>
              <input
                id={f.id}
                type={f.type}
                placeholder={f.ph}
                value={form[f.field]}
                onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
                className="admin-form-input"
              />
            </div>
          ))}

          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="adm-password">Senha inicial *</label>
            <div className="admin-pw-wrap">
              <input
                id="adm-password"
                type={showPw ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="admin-form-input"
              />
              <button type="button" className="admin-pw-toggle" onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="admin-submit-btn" disabled={submitting}>
            <ShieldCheck size={16} />
            {submitting ? 'Criando...' : 'Criar administrador'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ── Reset admin password modal ─────────────────────────────────────────────────

const ResetAdminModal = ({ admin, onClose }: { admin: AdminItem; onClose: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/auth/admins/${admin.id}/reset-password`);
      setResult(res.data.data.temp_password);
    } catch { setResult(null); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16,
        padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <KeyRound size={18} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Redefinir senha</h3>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
          Gerar senha temporária para o administrador <strong style={{ color: 'var(--text)' }}>{admin.name}</strong>. Todas as sessões ativas serão encerradas.
        </p>
        {result ? (
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600, marginBottom: 6 }}>Senha temporária gerada:</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', fontFamily: 'monospace', letterSpacing: 1 }}>{result}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>Compartilhe de forma segura. O admin deve alterar a senha após o login.</div>
          </div>
        ) : (
          <button onClick={handleReset} disabled={loading} className="admin-submit-btn" style={{ width: '100%', marginBottom: 12 }}>
            <KeyRound size={15} />
            {loading ? 'Gerando...' : 'Gerar senha temporária'}
          </button>
        )}
        <button onClick={onClose} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          Fechar
        </button>
      </div>
    </div>
  );
};

// ── Main ───────────────────────────────────────────────────────────────────────

const AdminArea = () => {
  const [tab, setTab] = useState<Tab>('overview');

  return (
    <div className="admin-layout">
      <TeacherSidebar />
      <main className="admin-main">
        <div className="admin-container">
          <div className="admin-header">
            <h1>Área do <span>Admin</span></h1>
            <p>Gerencie alunos, professores, assinaturas e métricas da plataforma.</p>
          </div>

          <nav className="admin-tabs">
            {TABS.map(t => (
              <button key={t.id} className={`admin-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
                <t.icon size={15} />
                {t.label}
              </button>
            ))}
          </nav>

          {tab === 'overview'       && <Overview />}
          {tab === 'students'       && <Students />}
          {tab === 'teachers'       && <Teachers />}
          {tab === 'subscriptions'  && <Subscriptions />}
          {tab === 'pending'        && <Pending />}
          {tab === 'videos'         && <Videos />}
          {tab === 'vestibulares'   && <Vestibulares />}
          {tab === 'reports'        && <QuestionReports />}
          {tab === 'admins'         && <AdminManagement />}
        </div>
      </main>
    </div>
  );
};

export default AdminArea;
