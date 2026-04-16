import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { User, Lock, Bell, Shield } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/api';
import { AppDispatch, RootState } from '../../store/store';
import { getInitials } from '../../utils/stringUtils';
import { fetchVestibulares, setTargetVestibular } from '../../slices/questionsSlice';
import './Settings.css';

const Settings = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user: student } = useSelector((s: RootState) => s.auth);
  const { vestibulares } = useSelector((s: RootState) => s.questions);
  const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'notifications' | 'privacy'>('profile');
  const [targetVestibularId, setTargetVestibularId] = useState<string>(String(student?.target_vestibular_id || ''));
  const [vestibularMsg, setVestibularMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    dispatch(fetchVestibulares());
  }, [dispatch]);

  const [profileForm, setProfileForm] = useState({
    name: student?.name || '',
    email: student?.email || '',
    avatar_url: student?.avatar_url || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);


  const handleSaveVestibular = async (id: string) => {
    setTargetVestibularId(id);
    try {
      await dispatch(setTargetVestibular(id ? parseInt(id) : null));
      setVestibularMsg({ type: 'success', text: 'Vestibular alvo atualizado!' });
    } catch {
      setVestibularMsg({ type: 'error', text: 'Erro ao salvar vestibular alvo.' });
    }
    setTimeout(() => setVestibularMsg(null), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      await api.put('/auth/me', profileForm); // endpoint may need to be added
      setProfileMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch {
      setProfileMsg({ type: 'error', text: 'Erro ao atualizar perfil. Tente novamente.' });
    }
    setProfileLoading(false);
    setTimeout(() => setProfileMsg(null), 4000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMsg({ type: 'error', text: 'As senhas nao coincidem.' });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setPasswordMsg({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await api.put('/auth/change-password', passwordForm); // endpoint may need to be added
      setPasswordMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch {
      setPasswordMsg({ type: 'error', text: 'Erro ao alterar senha. Verifique sua senha atual.' });
    }
    setPasswordLoading(false);
    setTimeout(() => setPasswordMsg(null), 4000);
  };

  const navItems = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'password', label: 'Senha', icon: Lock },
    { id: 'notifications', label: 'Notificacoes', icon: Bell },
    { id: 'privacy', label: 'Privacidade', icon: Shield },
  ];

  return (
    <div className="settings-page">
      <Sidebar />
      <main className="page-content">
        <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 800 }}>Configuracoes</h1>

        <div className="settings-layout">
          <div className="settings-nav">
            {navItems.map(item => (
              <button
                key={item.id}
                className={`settings-nav-item${activeSection === item.id ? ' active' : ''}`}
                onClick={() => setActiveSection(item.id as any)}
              >
                <item.icon size={17} />
                {item.label}
              </button>
            ))}
          </div>

          <div>
            {activeSection === 'profile' && (
              <div className="settings-section">
                <h2>Informacoes do perfil</h2>
                <p className="settings-desc">Atualize suas informacoes pessoais e foto de perfil.</p>

                <div className="avatar-section">
                  <div className="avatar-large">
                    {profileForm.avatar_url ? (
                      <img src={profileForm.avatar_url} alt="Avatar" onError={e => (e.currentTarget.style.display = 'none')} />
                    ) : (
                      getInitials(profileForm.name)
                    )}
                  </div>
                  <div className="avatar-info">
                    <h3>{student?.name}</h3>
                    <p>Matricula: {student?.enrollment}</p>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="URL da foto de perfil"
                        value={profileForm.avatar_url}
                        onChange={e => setProfileForm({ ...profileForm, avatar_url: e.target.value })}
                        style={{ fontSize: '13px' }}
                      />
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile}>
                  <div className="settings-form-grid">
                    <div className="form-group">
                      <label>Nome completo</label>
                      <input
                        type="text"
                        className="form-control"
                        value={profileForm.name}
                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>E-mail</label>
                      <input
                        type="email"
                        className="form-control"
                        value={profileForm.email}
                        onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={profileLoading} style={{ fontSize: '14px' }}>
                    {profileLoading ? 'Salvando...' : 'Salvar alteracoes'}
                  </button>

                  {profileMsg && (
                    <div className={profileMsg.type === 'success' ? 'settings-success' : 'settings-error'}>
                      {profileMsg.text}
                    </div>
                  )}
                </form>

                <div className="settings-vestibular">
                  <h3>Vestibular alvo</h3>
                  <p className="settings-desc">Defina para qual vestibular você está se preparando. As questões serão priorizadas de acordo com sua escolha.</p>
                  <select
                    className="form-control"
                    value={targetVestibularId}
                    onChange={e => handleSaveVestibular(e.target.value)}
                    style={{ maxWidth: '320px' }}
                  >
                    <option value="">Sem preferência</option>
                    {vestibulares.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name}{v.institution ? ` — ${v.institution}` : ''}
                      </option>
                    ))}
                  </select>
                  {vestibularMsg && (
                    <div className={vestibularMsg.type === 'success' ? 'settings-success' : 'settings-error'} style={{ marginTop: '8px' }}>
                      {vestibularMsg.text}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'password' && (
              <div className="settings-section">
                <h2>Alterar senha</h2>
                <p className="settings-desc">Mantenha sua conta segura com uma senha forte.</p>

                <form onSubmit={handleChangePassword}>
                  <div className="form-group">
                    <label>Senha atual</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordForm.current_password}
                      onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                      required
                      placeholder="Digite sua senha atual"
                    />
                  </div>
                  <div className="settings-form-grid">
                    <div className="form-group">
                      <label>Nova senha</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwordForm.new_password}
                        onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        required
                        placeholder="Minimo 6 caracteres"
                        minLength={6}
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirmar nova senha</label>
                      <input
                        type="password"
                        className="form-control"
                        value={passwordForm.confirm_password}
                        onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        required
                        placeholder="Repita a nova senha"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={passwordLoading} style={{ fontSize: '14px' }}>
                    {passwordLoading ? 'Alterando...' : 'Alterar senha'}
                  </button>

                  {passwordMsg && (
                    <div className={passwordMsg.type === 'success' ? 'settings-success' : 'settings-error'}>
                      {passwordMsg.text}
                    </div>
                  )}
                </form>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="settings-section">
                <h2>Notificacoes</h2>
                <p className="settings-desc">Configure como voce deseja receber notificacoes.</p>
                {[
                  { label: 'Novos simulados disponíveis', desc: 'Receba avisos quando novos simulados forem publicados.' },
                  { label: 'Lembretes de revisao', desc: 'Lembretes para os eventos do seu calendario.' },
                  { label: 'Atualizacoes da comunidade', desc: 'Comentarios e curtidas nos seus posts.' },
                  { label: 'Sessoes de mentoria', desc: 'Confirmacao e lembretes de sessoes agendadas.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{item.label}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.desc}</div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                      <input type="checkbox" defaultChecked={i < 2} style={{ opacity: 0, width: 0, height: 0 }} />
                      <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: i < 2 ? 'var(--primary)' : '#ccc', borderRadius: '24px', transition: '0.3s' }} />
                    </label>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="settings-section">
                <h2>Privacidade e seguranca</h2>
                <p className="settings-desc">Gerencie as configuracoes de privacidade da sua conta.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { label: 'Perfil publico na comunidade', desc: 'Outros alunos podem ver seu perfil no ranking.' },
                    { label: 'Mostrar progresso no ranking', desc: 'Sua posicao e pontuacao ficam visiveis para todos.' },
                    { label: 'Permitir mensagens diretas', desc: 'Outros alunos podem enviar mensagens para voce.' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{item.label}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.desc}</div>
                      </div>
                      <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                        <input type="checkbox" defaultChecked={i < 2} style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{ position: 'absolute', cursor: 'pointer', inset: 0, background: i < 2 ? 'var(--primary)' : '#ccc', borderRadius: '24px', transition: '0.3s' }} />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
