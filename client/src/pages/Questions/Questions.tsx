import { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Filter, Clock, ChevronRight, RotateCcw, PenLine, Trash2 } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { fetchQuestions, fetchSubjects, fetchVestibulares, Question, Alternative } from '../../slices/questionsSlice';
import { AppDispatch, RootState } from '../../store/store';
import api from '../../api/api';
import './Questions.css';

const QUESTION_TIME = 120;

const Questions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { questions, subjects, vestibulares, loading } = useSelector((state: RootState) => state.questions);

  const [filters, setFilters] = useState({ subject_id: '', difficulty: '', vestibular_id: '' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAlt, setSelectedAlt] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [timer, setTimer] = useState(QUESTION_TIME);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [finished, setFinished] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlights, setHighlights] = useState<{ start: number; end: number }[]>([]);
  const statementRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    dispatch(fetchSubjects());
    dispatch(fetchVestibulares());
  }, [dispatch]);

  useEffect(() => {
    if (!answered && questions.length > 0 && !finished) {
      setTimer(QUESTION_TIME);
      const interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentIndex, answered, questions.length, finished]);

  const handleSearch = async () => {
    dispatch(fetchQuestions({ ...filters, limit: 200 }));
    setCurrentIndex(0);
    setSelectedAlt(null);
    setAnswered(false);
    setIsCorrect(null);
    setFinished(false);
    setScore({ correct: 0, total: 0 });

    try {
      const res = await api.post('/simulations/1/start'); // practice mode
      setSessionId(res.data.data.id);
    } catch {
      setSessionId(1);
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
          response_time_seconds: QUESTION_TIME - timer,
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

  const question: Question | undefined = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

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

            <button className="filter-btn" onClick={handleSearch} disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar questões'}
            </button>
            {Object.values(filters).some(v => v !== '') && (
              <button
                className="filter-clear-btn"
                onClick={() => setFilters({ subject_id: '', difficulty: '', vestibular_id: '' })}
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div>
            {finished ? (
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
                <div className="question-progress">
                  <span className="question-counter">Questao {currentIndex + 1} de {questions.length}</span>
                  <div className={`question-timer${timer <= 30 ? ' warning' : ''}`}>
                    <Clock size={16} />
                    {formatTime(timer)}
                  </div>
                </div>

                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>

                <div className="question-meta">
                  {question.topic?.subject && (
                    <span className="question-meta-tag question-meta-tag-subject">{question.topic.subject.name}</span>
                  )}
                  {question.topic && (
                    <span className="question-meta-tag question-meta-tag-topic">{question.topic.name}</span>
                  )}
                  {question.subtopic && (
                    <span className="question-meta-tag question-meta-tag-subtopic">{question.subtopic.name}</span>
                  )}
                  {question.vestibulares && question.vestibulares.length > 0 && question.vestibulares.map(v => (
                    <span key={v.id} className="question-meta-tag question-meta-tag-vestibular">{v.name}</span>
                  ))}
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
                  {renderWithHighlights(question.statement)}
                </p>

                {answered && (
                  <div className={`question-feedback ${isCorrect ? 'correct' : 'incorrect'}`}>
                    <strong>{isCorrect ? '✓ Resposta correta!' : '✗ Resposta incorreta!'}</strong>
                    {!isCorrect && (
                      <span>A resposta correta era: {question.alternatives.find(a => a.is_correct)?.letter}</span>
                    )}
                  </div>
                )}

                <div className="alternatives-list">
                  {question.alternatives.map((alt: Alternative) => {
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
                        <div className="alternative-text">{alt.text}</div>
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
