import { memo } from 'react';
import { HelpCircle, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import type { SessionSummary } from './types';

interface Props {
  questionCount: number;
  sessions: SessionSummary;
  loading: boolean;
}

const StatsGrid = ({ questionCount, sessions, loading }: Props) => {
  if (loading) {
    return (
      <div className="teacher-home-cards">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="teacher-stat-card">
            <div className="sk" style={{ width: 44, height: 44, borderRadius: 10, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="sk" style={{ width: 56, height: 28 }} />
              <div className="sk" style={{ width: 110, height: 14 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="teacher-home-cards">
      <div className="teacher-stat-card">
        <div className="teacher-stat-icon teacher-stat-icon-blue"><HelpCircle size={24} /></div>
        <div>
          <span className="teacher-stat-number">{questionCount}</span>
          <span className="teacher-stat-label">Questões criadas</span>
        </div>
      </div>
      <div className="teacher-stat-card">
        <div className="teacher-stat-icon teacher-stat-icon-green"><MessageCircle size={24} /></div>
        <div>
          <span className="teacher-stat-number">{sessions.total}</span>
          <span className="teacher-stat-label">Total de sessões</span>
        </div>
      </div>
      <div className="teacher-stat-card">
        <div className="teacher-stat-icon teacher-stat-icon-orange"><Clock size={24} /></div>
        <div>
          <span className="teacher-stat-number">{sessions.pending}</span>
          <span className="teacher-stat-label">Sessões pendentes</span>
        </div>
      </div>
      <div className="teacher-stat-card">
        <div className="teacher-stat-icon teacher-stat-icon-purple"><CheckCircle size={24} /></div>
        <div>
          <span className="teacher-stat-number">{sessions.done}</span>
          <span className="teacher-stat-label">Sessões realizadas</span>
        </div>
      </div>
    </div>
  );
};

export default memo(StatsGrid);
