import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Lock, Bell, Shield, Camera, Check, Loader2, Eye, EyeOff,
} from 'lucide-react';
import TeacherSidebar from '../../components/TeacherSidebar';
import api from '../../api/api';
import { RootState } from '../../store/store';
import { updateUser } from '../../slices/authSlice';
import { getInitials } from '../../utils/stringUtils';
import AvatarPicker from '../../components/AvatarPicker/AvatarPicker';
import '../../pages/Settings/Settings.css';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Informe a senha atual'),
    new_password: z.string().min(6, 'Mínimo de 6 caracteres'),
    confirm_password: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine(d => d.new_password === d.confirm_password, {
    message: 'As senhas não coincidem',
    path: ['confirm_password'],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;
type Section = 'profile' | 'password' | 'notifications' | 'privacy';
type SaveState = 'idle' | 'loading' | 'success' | 'error';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FieldError = ({ message }: { message?: string }) =>
  message ? <span className="field-error" role="alert">{message}</span> : null;

const SaveButton = ({ state, dirty, label = 'Salvar alterações' }: { state: SaveState; dirty: boolean; label?: string }) => (
  <button
    type="submit"
    className={`btn-save${state === 'success' ? ' success' : state === 'error' ? ' error' : ''}`}
    disabled={!dirty || state === 'loading'}
    aria-busy={state === 'loading'}
  >
    {state === 'loading' && <Loader2 size={16} className="spin" />}
    {state === 'success' && <Check size={16} />}
    {state === 'loading' ? 'Salvando...' : state === 'success' ? 'Salvo!' : label}
  </button>
);

const usePasswordToggle = () => {
  const [visible, setVisible] = useState(false);
  return { visible, toggle: () => setVisible(v => !v), type: visible ? 'text' : 'password' } as const;
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TeacherSettings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);
  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [profileState, setProfileState] = useState<SaveState>('idle');
  const [passwordState, setPasswordState] = useState<SaveState>('idle');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const current = usePasswordToggle();
  const next = usePasswordToggle();
  const confirm = usePasswordToggle();

  const profile = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name || '', email: user?.email || '' },
    mode: 'onChange',
  });

  const pwd = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
    mode: 'onChange',
  });

  const handleAvatarSave = async (avatarUrl: string, file?: File) => {
    try {
      if (file) {
        const formData = new FormData();
        formData.append('avatar', file);
        const res = await api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        dispatch(updateUser({ avatar_url: res.data.data.avatar_url }));
      } else {
        await api.put('/auth/me', { ...profile.getValues(), avatar_url: avatarUrl });
        dispatch(updateUser({ avatar_url: avatarUrl }));
      }
      setShowAvatarPicker(false);
    } catch {
      setProfileError('Erro ao atualizar foto. Tente novamente.');
      setTimeout(() => setProfileError(''), 4000);
    }
  };

  const onSaveProfile = async (data: ProfileValues) => {
    setProfileState('loading');
    setProfileError('');
    try {
      await api.put('/auth/me', data);
      dispatch(updateUser(data));
      setProfileState('success');
      profile.reset(data);
      setTimeout(() => setProfileState('idle'), 2500);
    } catch {
      setProfileState('error');
      setProfileError('Erro ao atualizar perfil. Tente novamente.');
      setTimeout(() => setProfileState('idle'), 3000);
    }
  };

  const onChangePassword = async (data: PasswordValues) => {
    setPasswordState('loading');
    setPasswordError('');
    try {
      await api.put('/auth/change-password', data);
      setPasswordState('success');
      pwd.reset();
      setTimeout(() => setPasswordState('idle'), 2500);
    } catch {
      setPasswordState('error');
      setPasswordError('Erro ao alterar senha. Verifique a senha atual.');
      setTimeout(() => setPasswordState('idle'), 3000);
    }
  };

  const navItems = [
    { id: 'profile' as Section, label: 'Perfil', icon: User },
    { id: 'password' as Section, label: 'Senha', icon: Lock },
    { id: 'notifications' as Section, label: 'Notificações', icon: Bell },
    { id: 'privacy' as Section, label: 'Privacidade', icon: Shield },
  ];

  const currentAvatar = user?.avatar_url || '';
  const currentName = user?.name || '';

  return (
    <div className="teacher-layout">
      <TeacherSidebar />
      {showAvatarPicker && (
        <AvatarPicker
          currentAvatar={currentAvatar}
          name={currentName}
          onSave={handleAvatarSave}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
      <main className="teacher-main">
        <div style={{ padding: '32px' }}>
          <h1 className="settings-title">Configurações</h1>

          <div className="settings-layout">
            <nav className="settings-nav" aria-label="Seções de configurações">
              {navItems.map(item => (
                <button
                  key={item.id}
                  className={`settings-nav-item${activeSection === item.id ? ' active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                  aria-current={activeSection === item.id ? 'page' : undefined}
                >
                  <item.icon size={16} strokeWidth={1.75} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="settings-content">
              {/* ── Profile ── */}
              {activeSection === 'profile' && (
                <div className="settings-section">
                  <div className="settings-section-header">
                    <h2>Informações do perfil</h2>
                    <p className="settings-desc">Atualize suas informações pessoais e foto de perfil.</p>
                  </div>

                  <div className="avatar-section">
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <div className="avatar-large">
                        {currentAvatar ? (
                          <img src={currentAvatar} alt="Avatar" onError={e => (e.currentTarget.style.display = 'none')} />
                        ) : (
                          getInitials(currentName)
                        )}
                      </div>
                      <button
                        type="button"
                        className="avatar-camera-btn"
                        onClick={() => setShowAvatarPicker(true)}
                        aria-label="Alterar foto de perfil"
                        title="Alterar foto de perfil"
                      >
                        <Camera size={15} />
                      </button>
                    </div>
                    <div className="avatar-info">
                      <h3>{currentName}</h3>
                      <p>Matrícula: {user?.enrollment}</p>
                      <button
                        type="button"
                        className="btn-save"
                        style={{ fontSize: '13px', padding: '7px 14px' }}
                        onClick={() => setShowAvatarPicker(true)}
                      >
                        <Camera size={14} />
                        Alterar foto de perfil
                      </button>
                    </div>
                  </div>

                  <form onSubmit={profile.handleSubmit(onSaveProfile)} noValidate>
                    <div className="settings-form-grid">
                      <div className="form-group">
                        <label htmlFor="teacher-profile-name" className="form-label">Nome completo</label>
                        <input
                          id="teacher-profile-name"
                          type="text"
                          className={`form-control${profile.formState.errors.name ? ' input-error' : ''}`}
                          {...profile.register('name')}
                          autoComplete="name"
                        />
                        <FieldError message={profile.formState.errors.name?.message} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="teacher-profile-email" className="form-label">E-mail</label>
                        <input
                          id="teacher-profile-email"
                          type="email"
                          className={`form-control${profile.formState.errors.email ? ' input-error' : ''}`}
                          {...profile.register('email')}
                          autoComplete="email"
                        />
                        <FieldError message={profile.formState.errors.email?.message} />
                      </div>
                    </div>
                    <div className="settings-actions">
                      <SaveButton state={profileState} dirty={profile.formState.isDirty} />
                      {profileError && <span className="inline-error">{profileError}</span>}
                    </div>
                  </form>
                </div>
              )}

              {/* ── Password ── */}
              {activeSection === 'password' && (
                <div className="settings-section">
                  <div className="settings-section-header">
                    <h2>Alterar senha</h2>
                    <p className="settings-desc">Mantenha sua conta segura com uma senha forte.</p>
                  </div>

                  <form onSubmit={pwd.handleSubmit(onChangePassword)} noValidate>
                    <div className="form-group">
                      <label htmlFor="teacher-current-pwd" className="form-label">Senha atual</label>
                      <div className="input-password-wrap">
                        <input
                          id="teacher-current-pwd"
                          type={current.type}
                          className={`form-control${pwd.formState.errors.current_password ? ' input-error' : ''}`}
                          placeholder="Digite sua senha atual"
                          {...pwd.register('current_password')}
                          autoComplete="current-password"
                        />
                        <button type="button" className="pwd-toggle" onClick={current.toggle} aria-label="Mostrar senha atual" tabIndex={-1}>
                          {current.visible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <FieldError message={pwd.formState.errors.current_password?.message} />
                    </div>

                    <div className="settings-form-grid">
                      <div className="form-group">
                        <label htmlFor="teacher-new-pwd" className="form-label">Nova senha</label>
                        <div className="input-password-wrap">
                          <input
                            id="teacher-new-pwd"
                            type={next.type}
                            className={`form-control${pwd.formState.errors.new_password ? ' input-error' : ''}`}
                            placeholder="Mínimo 6 caracteres"
                            {...pwd.register('new_password')}
                            autoComplete="new-password"
                          />
                          <button type="button" className="pwd-toggle" onClick={next.toggle} aria-label="Mostrar nova senha" tabIndex={-1}>
                            {next.visible ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <FieldError message={pwd.formState.errors.new_password?.message} />
                      </div>

                      <div className="form-group">
                        <label htmlFor="teacher-confirm-pwd" className="form-label">Confirmar nova senha</label>
                        <div className="input-password-wrap">
                          <input
                            id="teacher-confirm-pwd"
                            type={confirm.type}
                            className={`form-control${pwd.formState.errors.confirm_password ? ' input-error' : ''}`}
                            placeholder="Repita a nova senha"
                            {...pwd.register('confirm_password')}
                            autoComplete="new-password"
                          />
                          <button type="button" className="pwd-toggle" onClick={confirm.toggle} aria-label="Mostrar confirmação" tabIndex={-1}>
                            {confirm.visible ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <FieldError message={pwd.formState.errors.confirm_password?.message} />
                      </div>
                    </div>

                    <div className="settings-actions">
                      <SaveButton state={passwordState} dirty={pwd.formState.isDirty} label="Alterar senha" />
                      {passwordError && <span className="inline-error">{passwordError}</span>}
                    </div>
                  </form>
                </div>
              )}

              {/* ── Notifications ── */}
              {activeSection === 'notifications' && (
                <div className="settings-section">
                  <div className="settings-section-header">
                    <h2>Notificações</h2>
                    <p className="settings-desc">Configure como você deseja receber notificações.</p>
                  </div>
                  {[
                    { label: 'Novas sessões de mentoria', desc: 'Receba avisos quando um aluno agendar uma sessão.' },
                    { label: 'Lembretes de sessões', desc: 'Lembretes para sessões confirmadas no seu calendário.' },
                    { label: 'Atualizações de questões', desc: 'Notificações sobre o desempenho dos alunos nas suas questões.' },
                    { label: 'Mensagens da plataforma', desc: 'Avisos administrativos e novidades do sistema.' },
                  ].map((item, i) => (
                    <div key={i} className="toggle-row">
                      <div>
                        <div className="toggle-label">{item.label}</div>
                        <div className="toggle-desc">{item.desc}</div>
                      </div>
                      <label className="toggle-switch" aria-label={item.label}>
                        <input type="checkbox" defaultChecked={i < 2} />
                        <span className="toggle-track" />
                      </label>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Privacy ── */}
              {activeSection === 'privacy' && (
                <div className="settings-section">
                  <div className="settings-section-header">
                    <h2>Privacidade e segurança</h2>
                    <p className="settings-desc">Gerencie as configurações de privacidade da sua conta.</p>
                  </div>
                  {[
                    { label: 'Perfil público para alunos', desc: 'Alunos podem ver seu perfil e informações de contato.' },
                    { label: 'Mostrar disponibilidade', desc: 'Sua disponibilidade para mentoria fica visível na plataforma.' },
                    { label: 'Permitir mensagens diretas', desc: 'Alunos podem enviar mensagens diretamente para você.' },
                  ].map((item, i) => (
                    <div key={i} className="toggle-row">
                      <div>
                        <div className="toggle-label">{item.label}</div>
                        <div className="toggle-desc">{item.desc}</div>
                      </div>
                      <label className="toggle-switch" aria-label={item.label}>
                        <input type="checkbox" defaultChecked={i < 2} />
                        <span className="toggle-track" />
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherSettings;
