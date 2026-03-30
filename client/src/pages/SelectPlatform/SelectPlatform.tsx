import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Play, GraduationCap, Brain, ArrowLeft } from 'lucide-react';
import { RootState } from '../../store/store';
import './SelectPlatform.css';

const SelectPlatform = () => {
  const { student } = useSelector((state: RootState) => state.auth);

  return (
    <div className="select-platform">
      <div className="select-platform-bg" />
      <div className="select-platform-inner">
        <div className="select-platform-logo">
          <div className="select-platform-logo-icon">
            <Brain size={24} />
          </div>
          <span className="select-platform-logo-text">THE BEST</span>
        </div>

        <Link to="/" className="select-platform-back-btn">
          <ArrowLeft size={16} />
          Voltar para home
        </Link>

        <h1>Olá, {student?.name?.split(' ')[0] || 'Aluno'}!</h1>
        <p>Escolha por onde você quer comecar hoje.</p>

        <div className="select-platform-cards">
          <Link to="/sinaflix" className="platform-card">
            <div className="platform-card-icon platform-card-icon-sinaflix">
              <Play size={36} />
            </div>
            <div className="platform-card-badge">Videoaulas</div>
            <h2>Sinaflix</h2>
            <p>Assista as melhores vídeoaulas dos nossos professores, organizadas por disciplina e tópico.</p>
            <div className="platform-card-btn">Acessar Sinaflix</div>
          </Link>

          <Link to="/classroom/home" className="platform-card">
            <div className="platform-card-icon platform-card-icon-espaco">
              <GraduationCap size={36} />
            </div>
            <div className="platform-card-badge" style={{ background: 'rgba(15,139,141,0.2)', color: '#4dd8da' }}>
              Sala de Aula
            </div>
            <h2>Espaço Aluno</h2>
            <p>Questões, simulados, calendário de revisão, mentoria, comunidade e muito mais.</p>
            <div className="platform-card-btn">Acessar Espaco Aluno</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SelectPlatform;
