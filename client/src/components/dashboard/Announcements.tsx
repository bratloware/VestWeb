import { useState, memo } from 'react';
import { Megaphone, Trash2, Send, CheckCircle, Loader2 } from 'lucide-react';
import type { AnnouncementItem } from './types';

interface Props {
  announcements: AnnouncementItem[];
  onAdd: (content: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  return `${Math.floor(hrs / 24)}d atrás`;
};

const Announcements = ({ announcements, onAdd, onDelete }: Props) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await onAdd(text.trim());
      setText('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
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
          className="teacher-announcements-input"
          placeholder="Ex: Pessoal, amanhã teremos simulado especial às 19h!"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={3}
          maxLength={500}
          onKeyDown={handleKeyDown}
        />
        <div className="teacher-announcements-compose-footer">
          <span className="teacher-announcements-hint">Ctrl+Enter para enviar</span>
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

      {announcements.length === 0 && (
        <div className="teacher-announcements-empty">
          <Megaphone size={28} />
          <p>Nenhum aviso ativo.</p>
          <span>Comunique-se com seus alunos agora.</span>
        </div>
      )}

      {announcements.length > 0 && (
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
