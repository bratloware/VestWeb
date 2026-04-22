import { useState, useRef, useCallback, memo } from 'react';
import { Megaphone, Trash2, Send, CheckCircle, Loader2 } from 'lucide-react';
import type { AnnouncementItem } from './types';

const MAX_CHARS = 280;

interface Props {
  announcements: AnnouncementItem[];
  onAdd: (content: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  loading?: boolean;
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
};

const Announcements = ({ announcements, onAdd, onDelete, loading }: Props) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length > MAX_CHARS) return;
    setText(val);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await onAdd(text.trim());
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = '';
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Erro ao publicar aviso. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const charsLeft = MAX_CHARS - text.length;
  const nearLimit = charsLeft <= 40;

  return (
    <div className="teacher-announcements-widget">
      <div className="teacher-announcements-header">
        <div className="teacher-upcoming-title">
          <Megaphone size={18} />
          <h2>Avisos para os alunos</h2>
        </div>
        <span className="teacher-announcements-sub">
          {announcements.length} ativo{announcements.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="teacher-announcements-compose">
        <textarea
          ref={textareaRef}
          className="teacher-announcements-input"
          placeholder="Ex: Pessoal, amanhã teremos simulado especial às 19h!"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
        {error && <p className="teacher-announcements-error">{error}</p>}
        <div className="teacher-announcements-compose-footer">
          <span className="teacher-announcements-hint">Ctrl+Enter para enviar</span>
          <div className="teacher-announcements-compose-right">
            <span className={`teacher-announcements-counter${nearLimit ? ' near-limit' : ''}`}>
              {text.length}/{MAX_CHARS}
            </span>
            <button
              className={`teacher-announcements-send${success ? ' success' : ''}`}
              onClick={handleSend}
              disabled={!text.trim() || sending || success}
            >
              {sending
                ? <Loader2 size={14} className="btn-spin" />
                : success
                  ? <CheckCircle size={14} />
                  : <Send size={14} />}
              {sending ? 'Enviando...' : success ? 'Publicado!' : 'Publicar aviso'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <ul className="teacher-announcements-list">
          {[...Array(2)].map((_, i) => (
            <li key={i} className="teacher-announcement-item">
              <div className="teacher-announcement-body" style={{ flex: 1, gap: 8, display: 'flex', flexDirection: 'column' }}>
                <div className="sk" style={{ width: '85%', height: 13 }} />
                <div className="sk" style={{ width: '40%', height: 11 }} />
              </div>
            </li>
          ))}
        </ul>
      ) : announcements.length === 0 ? (
        <div className="teacher-announcements-empty">
          <Megaphone size={28} />
          <p>Nenhum aviso ativo.</p>
          <span>Comunique-se com seus alunos agora.</span>
        </div>
      ) : (
        <ul className="teacher-announcements-list">
          {announcements.map(a => (
            <li key={a.id} className="teacher-announcement-item">
              <div className="teacher-announcement-body">
                <p>{a.content}</p>
                <time>{timeAgo(a.created_at)}</time>
              </div>
              <button
                className="teacher-announcement-delete"
                onClick={() => onDelete(a.id)}
                title="Remover aviso"
                aria-label="Remover aviso"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default memo(Announcements);
