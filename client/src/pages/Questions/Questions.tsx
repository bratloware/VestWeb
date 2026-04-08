import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Filter, Clock, ChevronRight, RotateCcw, Search } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { fetchQuestions, fetchSubjects, fetchVestibulares, Question, Alternative } from '../../slices/questionsSlice';
import { AppDispatch, RootState } from '../../store/store';
import api from '../../api/api';
import './Questions.css';

const QUESTION_TIME = 120;

const Questions = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { questions, subjects, vestibulares, loading } = useSelector((state: RootState) => state.questions);

  const [filters, setFilters] = useState({ subject_id: '', topic_id: '', subtopic_id: '', difficulty: '', vestibular_id: '' });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAlt, setSelectedAlt] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [timer, setTimer] = useState(QUESTION_TIME);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [finished, setFinished] = useState(false);

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
    dispatch(fetchQuestions(filters));
    setCurrentIndex(0);
    setSelectedAlt(null);
    setAnswered(false);
    setIsCorrect(null);
    setFinished(false);
    setScore({ correct: 0, total: 0 });

    // Create a practice session
    try {
      const res = await api.post('/simulations/1/start'); // practice mode
      setSessionId(res.data.data.id);
    } catch {
      setSessionId(1); // fallback
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

  const topicsForSubject = subjects.find(s => s.id === parseInt(filters.subject_id))?.topics || [];
  const subtopicsForTopic = topicsForSubject.find(t => t.id === parseInt(filters.topic_id))?.subtopics || [];
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
            </div>

            <div className="form-group">
              <label>Materia</label>
              <select
                className="form-control"
                value={filters.subject_id}
                onChange={e => setFilters({ ...filters, subject_id: e.target.value, topic_id: '', subtopic_id: '' })}
              >
                <option value="">Todas as materias</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {filters.subject_id && (
              <div className="form-group">
                <label>Tópico</label>
                <select
                  className="form-control"
                  value={filters.topic_id}
                  onChange={e => setFilters({ ...filters, topic_id: e.target.value, subtopic_id: '' })}
                >
                  <option value="">Todos os tópicos</option>
                  {topicsForSubject.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {filters.topic_id && (
              <div className="form-group">
                <label>Subtópico</label>
                <select
                  className="form-control"
                  value={filters.subtopic_id}
                  onChange={e => setFilters({ ...filters, subtopic_id: e.target.value })}
                >
                  <option value="">Todos os subtópicos</option>
                  {subtopicsForTopic.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
            )}

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
              {loading ? 'Buscando...' : 'Buscar questoes'}
            </button>
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

                <p className="question-statement">{question.statement}</p>

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
