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

const mockSubjects: SubjectStats[] = [
  { name: 'Biologia', accuracy: 72, total: 120, correct: 86 },
  { name: 'Quimica', accuracy: 58, total: 95, correct: 55 },
  { name: 'Fisica', accuracy: 45, total: 80, correct: 36 },
  { name: 'Matematica', accuracy: 65, total: 110, correct: 72 },
  { name: 'Portugues', accuracy: 80, total: 70, correct: 56 },
  { name: 'Historia', accuracy: 88, total: 50, correct: 44 },
];

const mockSessions = [
  { label: 'Seg', score: 75, color: '#10b981' },
  { label: 'Ter', score: 60, color: '#f59e0b' },
  { label: 'Qua', score: 82, color: '#10b981' },
  { label: 'Qui', score: 55, color: '#f59e0b' },
  { label: 'Sex', score: 90, color: '#10b981' },
  { label: 'Sab', score: 40, color: '#ef4444' },
  { label: 'Dom', score: 70, color: '#10b981' },
];

const Metrics = () => {
  const [totalPoints, setTotalPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAnswered] = useState(525);
  const [overallAccuracy] = useState(67);
  const [subjects] = useState<SubjectStats[]>(mockSubjects);

  useEffect(() => {
    api.get('/gamification/points').then(r => setTotalPoints(r.data.data?.total_points || 0)).catch(() => {});
    api.get('/gamification/streak').then(r => setStreak(r.data.data?.current_streak || 0)).catch(() => {});
  }, []);

  const getAccuracyClass = (acc: number) => acc >= 70 ? 'high' : acc >= 50 ? 'medium' : 'low';

  return (
    <div className="metrics-page">
      <Sidebar />
      <main className="page-content">
        <h1 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 800 }}>Metricas de Desempenho</h1>

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
          </div>

          <div className="metrics-chart-card">
            <h2>Ultimas 7 sessoes</h2>
            <div className="sessions-list">
              {mockSessions.map(s => (
                <div key={s.label} className="session-row">
                  <div className="session-row-label">{s.label}</div>
                  <div className="session-progress-bar">
                    <div
                      className="session-progress-fill"
                      style={{ width: `${s.score}%`, background: s.color }}
                    />
                  </div>
                  <div className="session-row-value">{s.score}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Missed topics table */}
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
      </main>
    </div>
  );
};

export default Metrics;
