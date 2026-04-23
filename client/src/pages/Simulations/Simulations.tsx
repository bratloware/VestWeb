import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Clock, BookOpen, HelpCircle, RotateCcw } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { fetchSimulations, fetchSimulationById, startSession, finishSession, fetchHistory } from '../../slices/simulationsSlice';
import { AppDispatch, RootState } from '../../store/store';
import api from '../../api/api';
import './Simulations.css';

const Simulations = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { simulations, currentSimulation, session, history, loading, error } = useSelector((s: RootState) => s.simulations);

  const [mode, setMode] = useState<'list' | 'running' | 'result'>('list');
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAlts, setSelectedAlts] = useState<Record<number, number>>({});
  const [answeredQs, setAnsweredQs] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState({ score: 0, correct: 0, total: 0 });
  const [showHistory, setShowHistory] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    dispatch(fetchSimulations());
    dispatch(fetchHistory());
  }, [dispatch]);

  const startSim = async (simId: number) => {
    setStartError(null);

    const simulationRes = await dispatch(fetchSimulationById(simId));
    if (fetchSimulationById.rejected.match(simulationRes)) {
      setStartError((simulationRes.payload as string) || 'Nao foi possivel carregar o simulado.');
      return;
    }

    const loadedQuestions = simulationRes.payload?.simulationQuestions
      ?.map((sq: any) => sq?.question)
      ?.filter(Boolean) || [];

    if (loadedQuestions.length === 0) {
      setStartError('Este simulado ainda nao possui questoes disponiveis.');
      return;
    }

    const sessionRes = await dispatch(startSession(simId));
    if (!startSession.fulfilled.match(sessionRes)) {
      setStartError((sessionRes.payload as string) || 'Nao foi possivel iniciar o simulado.');
      return;
    }

    setMode('running');
    setCurrentQIdx(0);
    setSelectedAlts({});
    setAnsweredQs(new Set());
  };

  useEffect(() => {
    if (mode === 'running' && currentSimulation) {
      const totalSeconds = Number(currentSimulation.time_limit_minutes || 0) * 60;
      setTimeLeft(totalSeconds > 0 ? totalSeconds : 3600);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [mode, currentSimulation]);

  const handleAnswerQ = async (questionId: number, altId: number) => {
    setSelectedAlts(prev => ({ ...prev, [questionId]: altId }));
    if (!answeredQs.has(questionId) && session) {
      setAnsweredQs(prev => new Set(prev).add(questionId));
      try {
        await api.post('/questions/answer', {
          session_id: session.id,
          question_id: questionId,
          chosen_alternative_id: altId,
          response_time_seconds: (currentSimulation?.time_limit_minutes || 60) * 60 - timeLeft,
        });
      } catch { /* ignore */ }
    }
  };

  const handleFinish = async () => {
    clearInterval(timerRef.current);
    if (session?.id) {
      const res = await dispatch(finishSession(session.id));
      if (finishSession.fulfilled.match(res)) {
        setResult({
          score: res.payload.score || 0,
          correct: res.payload.correct || 0,
          total: res.payload.total || 0,
        });
        dispatch(fetchHistory());
      }
    }
    setMode('result');
  };

  const formatTime = (s: number) => `${Math.floor(s / 3600).toString().padStart(2, '0')}:${Math.floor((s % 3600) / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const normalizeText = (text?: string | null) => (text || '').replace(/\u00A0/g, ' ');

  const questions = currentSimulation?.simulationQuestions?.map((sq: any) => sq?.question)?.filter(Boolean) || [];
  const currentQ = questions[currentQIdx];

  useEffect(() => {
    if (mode === 'running' && questions.length > 0 && currentQIdx >= questions.length) {
      setCurrentQIdx(0);
    }
  }, [mode, questions.length, currentQIdx]);

  const getDifficultyLabel = (d: string) => ({ easy: 'Facil', medium: 'Media', hard: 'Dificil', mixed: 'Mista' }[d] || d);

  return (
    <div className="simulations-page">
      <Sidebar />
      <main className="page-content">
        {mode === 'list' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Simulados</h1>
              <button
                className="btn-secondary"
                onClick={() => {
                  setStartError(null);
                  setShowHistory(!showHistory);
                }}
                style={{ fontSize: '14px' }}
              >
                {showHistory ? 'Ver simulados' : 'Ver historico'}
              </button>
            </div>

            {(startError || error) && (
              <div
                style={{
                  marginBottom: '16px',
                  background: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.35)',
                  color: '#b91c1c',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  fontSize: '14px',
                }}
              >
                {startError || error}
              </div>
            )}

            {!showHistory ? (
              loading ? (
                <div className="spinner" />
              ) : simulations.length === 0 ? (
                <div className="empty-state">
                  <BookOpen size={48} />
                  <h3>Nenhum simulado disponivel</h3>
                  <p>Em breve novos simulados serao adicionados.</p>
                </div>
              ) : (
                <div className="simulations-list">
                  {simulations.map(sim => (
                    <div key={sim.id} className="simulation-card">
                      <div className="simulation-card-header">
                        <div className="simulation-card-title">{sim.title}</div>
                        {sim.is_weekly && <span className="simulation-weekly-badge">Semanal</span>}
                      </div>
                      <div className="simulation-meta">
                        <div className="simulation-meta-item">
                          <HelpCircle size={14} />
                          {sim.total_questions} questoes
                        </div>
                        <div className="simulation-meta-item">
                          <Clock size={14} />
                          {sim.time_limit_minutes} min
                        </div>
                        <span className={`badge badge-${sim.difficulty}`}>{getDifficultyLabel(sim.difficulty)}</span>
                      </div>
                      <div className="simulation-card-footer">
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Criado em: {new Date(sim.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <button className="btn-primary" onClick={() => startSim(sim.id)} style={{ padding: '8px 20px', fontSize: '14px' }}>
                          Iniciar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="history-section">
                <h2>Historico de simulados</h2>
                <div className="history-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Simulado</th>
                        <th>Data</th>
                        <th>Acertos</th>
                        <th>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length === 0 ? (
                        <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>Nenhum historico ainda.</td></tr>
                      ) : (
                        history.map((h: any) => {
                          const scorePct = h.score || 0;
                          const cls = scorePct >= 70 ? 'high' : scorePct >= 50 ? 'medium' : 'low';
                          return (
                            <tr key={h.id}>
                              <td>{h.simulation?.title || 'Simulado'}</td>
                              <td>{new Date(h.started_at).toLocaleDateString('pt-BR')}</td>
                              <td>{h.correct}/{h.total}</td>
                              <td><span className={`score-badge ${cls}`}>{scorePct}%</span></td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {mode === 'running' && (
          !currentSimulation || questions.length === 0 || !currentQ ? (
            <div className="empty-state">
              <BookOpen size={48} />
              <h3>Nao foi possivel exibir este simulado</h3>
              <p>Esse simulado pode estar sem questoes vinculadas no momento.</p>
              <button
                className="btn-primary"
                onClick={() => {
                  setMode('list');
                  setStartError('Este simulado nao possui questoes para responder.');
                }}
                style={{ marginTop: '12px' }}
              >
                Voltar para simulados
              </button>
            </div>
          ) : (
            <div className="simulation-active">
              <div className="simulation-active-header">
                <div>
                  <div className="simulation-active-title">{currentSimulation.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Questao {currentQIdx + 1} de {questions.length}
                  </div>
                </div>
                <div className={`simulation-timer${timeLeft < 300 ? ' warning' : ''}`}>
                  <Clock size={20} />
                  {formatTime(timeLeft)}
                </div>
              </div>

              <div className="simulation-question-nav">
                {questions.map((_: any, i: number) => (
                  <button
                    key={i}
                    className={`sim-q-btn${i === currentQIdx ? ' current' : ''}${selectedAlts[questions[i]?.id] ? ' answered' : ''}`}
                    onClick={() => setCurrentQIdx(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${(answeredQs.size / questions.length) * 100}%` }} />
              </div>

              <p className="simulation-question-statement">
                {normalizeText(currentQ.statement)}
              </p>

              {currentQ.image_url && (
                <img
                  className="simulation-question-image"
                  src={currentQ.image_url}
                  alt="Imagem da questao"
                  loading="lazy"
                />
              )}

              <div className="simulation-alternatives-list">
                {currentQ.alternatives?.map((alt: any) => (
                  <div
                    key={alt.id}
                    className={`simulation-alternative-item${selectedAlts[currentQ.id] === alt.id ? ' selected' : ''}`}
                    onClick={() => handleAnswerQ(currentQ.id, alt.id)}
                  >
                    <div className="simulation-alternative-letter">{alt.letter}</div>
                    <div className="simulation-alternative-text">
                      {normalizeText(alt.text)}
                      {alt.image_url && (
                        <img
                          className="simulation-alternative-image"
                          src={alt.image_url}
                          alt={`Imagem da alternativa ${alt.letter}`}
                          loading="lazy"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="question-actions" style={{ marginTop: '20px' }}>
                {currentQIdx < questions.length - 1 ? (
                  <button className="btn-primary" onClick={() => setCurrentQIdx(prev => prev + 1)}>
                    Proxima questao
                  </button>
                ) : (
                  <button className="btn-primary" onClick={handleFinish}>
                    Finalizar simulado
                  </button>
                )}
              </div>
            </div>
          )
        )}

        {mode === 'result' && (
          <div style={{ background: 'var(--white)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
            <div className="simulation-result">
              <div className="result-circle">
                <span className="result-percent">{result.score}%</span>
                <span className="result-label">acertos</span>
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Simulado concluido!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '28px' }}>{currentSimulation?.title}</p>
              <div className="result-stats">
                <div className="result-stat">
                  <strong>{result.correct}</strong>
                  <span>Corretas</span>
                </div>
                <div className="result-stat">
                  <strong>{result.total - result.correct}</strong>
                  <span>Erradas</span>
                </div>
                <div className="result-stat">
                  <strong>{result.total}</strong>
                  <span>Total</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn-primary" onClick={() => { setMode('list'); setShowHistory(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Ver historico
                </button>
                <button className="btn-secondary" onClick={() => setMode('list')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RotateCcw size={16} />
                  Voltar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Simulations;
