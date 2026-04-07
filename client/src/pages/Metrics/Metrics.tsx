import { useEffect, useState } from 'react';
import { BarChart2, Target, HelpCircle, Flame } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/api';
import './Metrics.css';

interface SubjectStats {
  name: string;
  accuracy: number;
  total: number;
  correct: number;
}

interface SessionData {
  label: string;
  score: number;
  date: string;
}

const Metrics = () => {
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [overallAccuracy, setOverallAccuracy] = useState(0);
  const [subjects, setSubjects] = useState<SubjectStats[]>([]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [metricsRes, pointsRes, streakRes] = await Promise.allSettled([
          api.get('/gamification/metrics'),
          api.get('/gamification/points'),
          api.get('/gamification/streak'),
        ]);

        if (metricsRes.status === 'fulfilled') {
          const d = metricsRes.value.data.data;
          setTotalAnswered(d.total_answered || 0);
          setOverallAccuracy(d.overall_accuracy || 0);
          setSubjects(d.subjects || []);
          setSessions(d.sessions || []);
        }
        if (pointsRes.status === 'fulfilled') {
          setTotalPoints(pointsRes.value.data.data?.total_points || 0);
        }
        if (streakRes.status === 'fulfilled') {
          setStreak(streakRes.value.data.data?.current_streak || 0);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const getAccuracyClass = (acc: number) => acc >= 70 ? 'high' : acc >= 50 ? 'medium' : 'low';

  const getSessionColor = (score: number) => score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="metrics-page">
      <Sidebar />
      <main className="page-content">
        <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 800 }}>Métricas de Desempenho</h1>

        {loading ? (
          <div className="spinner" />
        ) : (
          <>
            {/* Summary cards */}
            <div className="metrics-summary">
              <div className="metric-card">
                <div className="metric-icon metric-icon-blue"><HelpCircle size={24} /></div>
                <div className="metric-info">
                  <h3>{totalAnswered}</h3>
                  <p>Total respondidas</p>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon metric-icon-green"><Target size={24} /></div>
                <div className="metric-info">
                  <h3>{overallAccuracy}%</h3>
                  <p>Taxa de acerto geral</p>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon metric-icon-purple"><BarChart2 size={24} /></div>
                <div className="metric-info">
                  <h3>{totalPoints}</h3>
                  <p>Pontos totais</p>
                </div>
              </div>
              <div className="metric-card">
                <div className="metric-icon metric-icon-orange"><Flame size={24} /></div>
                <div className="metric-info">
                  <h3>{streak}</h3>
                  <p>Streak atual</p>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="metrics-charts">
              <div className="metrics-chart-card">
                <h2>Desempenho por materia (%)</h2>
                {subjects.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
                    Responda questões para ver seu desempenho por matéria.
                  </p>
                ) : (
                  <div className="bar-chart">
                    {subjects.map(s => (
                      <div key={s.name} className="bar-item">
                        <div
                          className="bar-fill"
                          style={{ height: `${s.accuracy}%` }}
                          title={`${s.name}: ${s.accuracy}%`}
                        >
                          <span className="bar-value" style={{ fontSize: '10px', top: '-18px' }}>{s.accuracy}%</span>
                        </div>
                        <div className="bar-label">{s.name.slice(0, 3)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="metrics-chart-card">
                <h2>Ultimas sessoes</h2>
                {sessions.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
                    Nenhuma sessão registrada ainda.
                  </p>
                ) : (
                  <div className="sessions-list">
                    {sessions.map((s, i) => (
                      <div key={i} className="session-row">
                        <div className="session-row-label">{s.label}</div>
                        <div className="session-progress-bar">
                          <div
                            className="session-progress-fill"
                            style={{ width: `${s.score}%`, background: getSessionColor(s.score) }}
                          />
                        </div>
                        <div className="session-row-value">{s.score}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Detailed table */}
            {subjects.length > 0 && (
              <div className="metrics-table-card">
                <h2>Desempenho detalhado por materia</h2>
                <table className="metrics-table">
                  <thead>
                    <tr>
                      <th>Materia</th>
                      <th>Questoes</th>
                      <th>Acertos</th>
                      <th>Taxa de acerto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...subjects].sort((a, b) => a.accuracy - b.accuracy).map(s => (
                      <tr key={s.name}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.total}</td>
                        <td>{s.correct}</td>
                        <td>
                          <div className="accuracy-bar">
                            <div className="accuracy-track">
                              <div
                                className={`accuracy-fill ${getAccuracyClass(s.accuracy)}`}
                                style={{ width: `${s.accuracy}%` }}
                              />
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: s.accuracy >= 70 ? '#10b981' : s.accuracy >= 50 ? '#f59e0b' : '#ef4444', minWidth: '40px' }}>
                              {s.accuracy}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Metrics;
