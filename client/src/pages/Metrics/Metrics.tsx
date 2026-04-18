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

interface SessionStat {
  label: string;
  score: number;
}

const Metrics = () => {
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [overallAccuracy, setOverallAccuracy] = useState(0);
  const [subjects, setSubjects] = useState<SubjectStats[]>([]);
  const [recentSessions, setRecentSessions] = useState<SessionStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/gamification/points').then(r => setTotalPoints(r.data.data?.total_points || 0)),
      api.get('/gamification/streak').then(r => setStreak(r.data.data?.current_streak || 0)),
      api.get('/gamification/stats').then(r => {
        setTotalAnswered(r.data.data?.total_answered || 0);
        setOverallAccuracy(r.data.data?.accuracy || 0);
      }),
      api.get('/gamification/subject-stats').then(r => setSubjects(r.data.data || [])),
      api.get('/gamification/recent-sessions').then(r => setRecentSessions(r.data.data || [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const getAccuracyClass = (acc: number) => acc >= 70 ? 'high' : acc >= 50 ? 'medium' : 'low';
  const getSessionColor = (score: number) => score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  if (loading) return (
    <div className="metrics-page">
      <Sidebar />
      <main className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </main>
    </div>
  );

  return (
    <div className="metrics-page">
      <Sidebar />
      <main className="page-content">
        <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 800 }}>Métricas de Desempenho</h1>

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
              <p style={{ color: '#888', padding: '24px 0', textAlign: 'center' }}>Nenhuma questão respondida ainda.</p>
            ) : (
              <div className="bar-chart">
                {subjects.map(s => (
                  <div key={s.name} className="bar-item">
                    <div
                      className="bar-fill"
                      style={{ height: `${s.accuracy}%` }}
                      data-value={`${s.accuracy}%`}
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
            {recentSessions.length === 0 ? (
              <p style={{ color: '#888', padding: '24px 0', textAlign: 'center' }}>Nenhuma sessão concluída ainda.</p>
            ) : (
              <div className="sessions-list">
                {recentSessions.map((s, i) => (
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
                {subjects.sort((a, b) => a.accuracy - b.accuracy).map(s => (
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
      </main>
    </div>
  );
};

export default Metrics;
