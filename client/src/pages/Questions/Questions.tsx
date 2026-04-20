import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Filter, ChevronRight, RotateCcw, PenLine, Trash2 } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { fetchQuestions, fetchSubjects, fetchVestibulares, Question, Alternative } from '../../slices/questionsSlice';
import { AppDispatch, RootState } from '../../store/store';
import api from '../../api/api';
import './Questions.css';

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

  // Clear highlights when question changes
  useEffect(() => { setHighlights([]); }, [currentIndex]);

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

                {question.reference && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', margin: '4px 0 12px' }}>
                    Disponível em: {question.reference}
                  </p>
                )}

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

                <div className="question-actions">
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
