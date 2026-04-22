import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Filter, ChevronRight, RotateCcw, PenLine, Trash2, Flag, X, Send, CheckCircle } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { fetchQuestions, fetchSubjects, fetchVestibulares, Question, Alternative } from '../../slices/questionsSlice';
import { AppDispatch, RootState } from '../../store/store';
import api from '../../api/api';
import './Questions.css';

// ── Report types ──────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { value: 'wrong_answer',       label: 'Gabarito incorreto' },
  { value: 'typo',               label: 'Erro de digitação/ortografia' },
  { value: 'image_missing',      label: 'Imagem ausente ou corrompida' },
  { value: 'unclear_statement',  label: 'Enunciado confuso ou incompleto' },
  { value: 'wrong_subject',      label: 'Disciplina/assunto incorreto' },
  { value: 'other',              label: 'Outro' },
] as const;

type ReportType = typeof REPORT_TYPES[number]['value'];
type ReportState = 'idle' | 'loading' | 'success';

interface ReportModalProps {
  questionId: number;
  onClose: () => void;
}

const ReportModal = ({ questionId, onClose }: ReportModalProps) => {
  const [errorType, setErrorType] = useState<ReportType | ''>('');
  const [description, setDescription] = useState('');
  const [state, setState] = useState<ReportState>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!errorType) { setError('Selecione o tipo de erro.'); return; }
    setState('loading');
    setError('');
    try {
      await api.post(`/questions/${questionId}/report`, { error_type: errorType, description: description.trim() || undefined });
      setState('success');
    } catch {
      setState('idle');
      setError('Erro ao enviar. Tente novamente.');
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={state !== 'success' ? onClose : undefined}
    >
      <div
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18,
          padding: 28, maxWidth: 440, width: '100%',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {state === 'success' ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
              Report enviado!
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              Obrigado por nos ajudar a melhorar nossa aplicação. Nossa equipe irá analisar e corrigir o erro em breve.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '10px 28px', borderRadius: 10, border: 'none',
                background: 'var(--primary)', color: 'white',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              Continuar respondendo
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Flag size={18} color="#ef4444" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>Reportar erro na questão</h3>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Selecione o tipo de erro encontrado:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {REPORT_TYPES.map(t => (
                  <label
                    key={t.value}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${errorType === t.value ? 'var(--primary)' : 'var(--border)'}`,
                      background: errorType === t.value ? 'rgba(99,102,241,0.07)' : 'var(--bg-secondary)',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <input
                      type="radio"
                      name="error_type"
                      value={t.value}
                      checked={errorType === t.value}
                      onChange={() => { setErrorType(t.value); setError(''); }}
                      style={{ accentColor: 'var(--primary)', width: 16, height: 16, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{t.label}</span>
                  </label>
                ))}
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                  Detalhes adicionais <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(opcional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descreva o erro com mais detalhes..."
                  rows={3}
                  maxLength={500}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1.5px solid var(--border)', background: 'var(--bg)',
                    color: 'var(--text)', fontSize: 13, resize: 'vertical',
                    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
              </div>

              {error && (
                <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 12, fontWeight: 600 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={state === 'loading' || !errorType}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px', borderRadius: 10, border: 'none',
                  background: !errorType ? 'var(--border)' : 'var(--primary)',
                  color: !errorType ? 'var(--text-secondary)' : 'white',
                  fontWeight: 700, fontSize: 14,
                  cursor: !errorType || state === 'loading' ? 'not-allowed' : 'pointer',
                  opacity: state === 'loading' ? 0.7 : 1,
                  transition: 'background 0.15s',
                }}
              >
                <Send size={15} />
                {state === 'loading' ? 'Enviando...' : 'Enviar report'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

const Questions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { questions, subjects, vestibulares, loading } = useSelector((state: RootState) => state.questions);

  const [filters, setFilters] = useState({ subject_id: '', difficulty: '', vestibular_id: '', with_image: '' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAlt, setSelectedAlt] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [finished, setFinished] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlights, setHighlights] = useState<{ start: number; end: number }[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const statementRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    dispatch(fetchSubjects());
    dispatch(fetchVestibulares());
  }, [dispatch]);

  const handleSearch = async () => {
    dispatch(fetchQuestions({ ...filters, limit: 200 }));
    setCurrentIndex(0);
    setSelectedAlt(null);
    setAnswered(false);
    setIsCorrect(null);
    setFinished(false);
    setScore({ correct: 0, total: 0 });

    try {
      const res = await api.post('/questions/session');
      setSessionId(res.data.data.id);
    } catch {
      setSessionId(null);
    }
  };

  const handleConfirm = async () => {
    if (selectedAlt === null) return;
    const question = questions[currentIndex];
    const chosen = question.alternatives.find(a => a.id === selectedAlt);
    const correct = chosen?.is_correct || false;

    setIsCorrect(correct);
    setAnswered(true);
    setScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 }));

    if (sessionId) {
      try {
        await api.post('/questions/answer', {
          session_id: sessionId,
          question_id: question.id,
          chosen_alternative_id: selectedAlt,
        });
      } catch { /* ignore */ }
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAlt(null);
      setAnswered(false);
      setIsCorrect(null);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAlt(null);
    setAnswered(false);
    setIsCorrect(null);
    setFinished(false);
    setScore({ correct: 0, total: 0 });
  };

  // Clear highlights and close report modal when question changes
  useEffect(() => { setHighlights([]); setReportOpen(false); }, [currentIndex]);

  const getTextOffset = (container: HTMLElement, node: Node, offset: number): number => {
    let total = 0;
    const walk = (n: Node): boolean => {
      if (n === node) { total += offset; return true; }
      if (n.nodeType === Node.TEXT_NODE) { total += n.textContent?.length ?? 0; }
      else { for (const child of Array.from(n.childNodes)) { if (walk(child)) return true; } }
      return false;
    };
    walk(container);
    return total;
  };

  const mergeRanges = (ranges: { start: number; end: number }[]) => {
    if (!ranges.length) return [];
    const sorted = [...ranges].sort((a, b) => a.start - b.start);
    const merged = [{ ...sorted[0] }];
    for (let i = 1; i < sorted.length; i++) {
      const last = merged[merged.length - 1];
      if (sorted[i].start <= last.end) last.end = Math.max(last.end, sorted[i].end);
      else merged.push({ ...sorted[i] });
    }
    return merged;
  };

  const handleMouseUp = () => {
    if (!highlightMode || !statementRef.current) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const container = statementRef.current;
    if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) return;
    const start = getTextOffset(container, range.startContainer, range.startOffset);
    const end = getTextOffset(container, range.endContainer, range.endOffset);
    if (start === end) return;
    setHighlights(prev => mergeRanges([...prev, { start: Math.min(start, end), end: Math.max(start, end) }]));
    sel.removeAllRanges();
  };

  const renderWithHighlights = (text: string) => {
    if (!highlights.length) return text;
    const parts: React.ReactNode[] = [];
    let pos = 0;
    for (const { start, end } of highlights) {
      if (pos < start) parts.push(text.slice(pos, start));
      parts.push(<mark key={start} className="question-highlight">{text.slice(start, end)}</mark>);
      pos = end;
    }
    if (pos < text.length) parts.push(text.slice(pos));
    return parts;
  };

  const preprocessStatement = (text: string): string => {
    // Remove \r\n do PDF e colapsa espaços extras
    text = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();

    // Remove título duplicado no início (ex: "Título Título, continua...")
    const words = text.split(' ');
    for (let len = 3; len <= Math.min(12, Math.floor(words.length / 2)); len++) {
      const firstPhrase = words.slice(0, len).join(' ');
      const rest = words.slice(len).join(' ');
      if (rest.startsWith(firstPhrase)) {
        const nextChar = rest[firstPhrase.length];
        if (!nextChar || /[,.\s;!?]/.test(nextChar)) {
          text = rest;
          break;
        }
      }
    }

    // Insere quebra de parágrafo antes de citações bibliográficas
    // Padrão: SOBRENOME, I. ou SOBRENOME; após ponto final
    text = text.replace(
      /(\.)(\s+)([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÀÈÌ]{2,},\s[A-Z]\.)/g,
      '.\n\n$3'
    );

    return text.trim();
  };

  const question: Question | undefined = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  return (
    <div className="questions-page">
      <Sidebar />
      <main className="page-content">
        <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 800 }}>Banco de Questoes</h1>

        <div className="questions-layout">
          <div className="questions-filters">
            <h2><Filter size={16} /> Filtros</h2>

            <div className="form-group">
              <label>Matéria</label>
              <select
                className="form-control"
                value={filters.subject_id}
                onChange={e => setFilters({ ...filters, subject_id: e.target.value })}
              >
                <option value="">Todas as matérias</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Vestibular</label>
              <select
                className="form-control"
                value={filters.vestibular_id}
                onChange={e => setFilters({ ...filters, vestibular_id: e.target.value })}
              >
                <option value="">Todos os vestibulares</option>
                {vestibulares.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Dificuldade</label>
              <select
                className="form-control"
                value={filters.difficulty}
                onChange={e => setFilters({ ...filters, difficulty: e.target.value })}
              >
                <option value="">Todas</option>
                <option value="easy">Fácil</option>
                <option value="medium">Média</option>
                <option value="hard">Difícil</option>
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <input
                type="checkbox"
                id="with_image"
                checked={filters.with_image === '1'}
                onChange={e => setFilters({ ...filters, with_image: e.target.checked ? '1' : '' })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="with_image" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '14px' }}>
                Só questões com imagem
              </label>
            </div>

            <button className="filter-btn" onClick={handleSearch} disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar questões'}
            </button>
            {Object.values(filters).some(v => v !== '') && (
              <button
                className="filter-clear-btn"
                onClick={() => setFilters({ subject_id: '', difficulty: '', vestibular_id: '', with_image: '' })}
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div>
            {loading ? (
              <div className="questions-loading">
                <div className="questions-spinner" />
                <p>Carregando questões...</p>
              </div>
            ) : finished ? (
              <div className="question-container">
                <div className="question-result">
                  <span className="result-score">{Math.round((score.correct / score.total) * 100)}%</span>
                  <h2>Resultado final</h2>
                  <p>{score.correct} de {score.total} questoes corretas</p>
                  <button className="btn-primary" onClick={handleRestart} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
                    <RotateCcw size={16} />
                    Tentar novamente
                  </button>
                </div>
              </div>
            ) : questions.length === 0 ? (
              <div className="questions-empty">
                <Filter size={48} />
                <h3>Nenhuma questao carregada</h3>
                <p>Use os filtros ao lado para buscar questoes e comecar a praticar.</p>
              </div>
            ) : question ? (
              <div className="question-container">
                {reportOpen && <ReportModal questionId={question.id} onClose={() => setReportOpen(false)} />}

                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>

                <div className="question-meta">
                  {question.subject && (
                    <span className="question-meta-tag question-meta-tag-topic">{question.subject}</span>
                  )}
                  {question.vestibular && (
                    <span className="question-meta-tag question-meta-tag-vestibular">{question.vestibular}</span>
                  )}
                  {question.year && (
                    <span className="question-meta-tag question-meta-tag-year">{question.year}</span>
                  )}
                  <span className={`badge badge-${question.difficulty}`}>
                    {question.difficulty === 'easy' ? 'Fácil' : question.difficulty === 'medium' ? 'Média' : 'Difícil'}
                  </span>
                </div>

                <div className="highlight-toolbar">
                  <button
                    className={`highlight-toggle${highlightMode ? ' active' : ''}`}
                    onClick={() => setHighlightMode(m => !m)}
                    title="Grifar enunciado"
                  >
                    <PenLine size={14} />
                    Grifar
                  </button>
                  {highlights.length > 0 && (
                    <button className="highlight-clear" onClick={() => setHighlights([])} title="Limpar grifos">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <p
                  ref={statementRef}
                  className={`question-statement${highlightMode ? ' highlight-active' : ''}`}
                  onMouseUp={handleMouseUp}
                >
                  {renderWithHighlights(preprocessStatement(question.statement))}
                </p>

                {question.image_url && (
                  <div style={{ marginBottom: '16px' }}>
                    <img src={question.image_url} alt="Imagem da questão" className="question-image" style={{ marginBottom: '4px' }} />
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', margin: 0 }}>
                      [{question.year} — {question.image_url.split('/').pop()}]
                    </p>
                  </div>
                )}

                {answered && (
                  <div className={`question-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                    <strong>{isCorrect ? '✓ Resposta correta!' : '✗ Resposta incorreta!'}</strong>
                    {!isCorrect && (
                      <span>A resposta correta era: {question.alternatives.find(a => a.is_correct)?.letter}</span>
                    )}
                  </div>
                )}

                <div className="alternatives-list">
                  {[...question.alternatives].sort((a, b) => a.letter.localeCompare(b.letter)).map((alt: Alternative) => {
                    let cls = 'alternative-item';
                    if (alt.id === selectedAlt) cls += ' selected';
                    if (answered) {
                      cls += ' disabled';
                      if (alt.is_correct) cls += ' correct';
                      else if (alt.id === selectedAlt && !alt.is_correct) cls += ' incorrect';
                    }
                    return (
                      <div
                        key={alt.id}
                        className={cls}
                        onClick={() => !answered && setSelectedAlt(alt.id)}
                      >
                        <div className="alternative-letter">{alt.letter}</div>
                        <div className="alternative-text">
                          {alt.text}
                          {alt.image_url && <img src={alt.image_url} alt={`Alternativa ${alt.letter}`} className="alternative-image" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="question-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {!answered ? (
                    <button
                      className="btn-primary"
                      onClick={handleConfirm}
                      disabled={selectedAlt === null}
                    >
                      Confirmar resposta
                    </button>
                  ) : (
                    <button className="btn-primary" onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {currentIndex + 1 >= questions.length ? 'Ver resultado' : 'Proxima questao'}
                      <ChevronRight size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => setReportOpen(true)}
                    title="Reportar erro nesta questão"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '9px 14px', borderRadius: 9,
                      border: '1.5px solid var(--border)', background: 'transparent',
                      color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
                  >
                    <Flag size={14} />
                    Reportar erro
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Questions;
