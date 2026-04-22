import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Play, GraduationCap, ArrowLeft, LucideIcon } from 'lucide-react';
import logo from '../../assets/images/logo.png';
import heroBg from '../../assets/images/bg-select-platform.jpg';
import { RootState } from '../../store/store';
import './SelectPlatform.css';

interface PlatformCardProps {
  title: string;
  description: string;
  badge: string;
  buttonText: string;
  href: string;
  icon: LucideIcon;
  variant: 'flix' | 'primary';
}

const ICON_SIZE = 36;

const PlatformCard = ({ title, description, badge, buttonText, href, icon: Icon, variant }: PlatformCardProps) => (
  <Link
    to={href}
    className={`platform-card${variant === 'flix' ? ' platform-card-flix' : ' platform-card-espaco'}`}
  >
    <div className={`platform-card-icon platform-card-icon-${variant === 'flix' ? 'VestWebFlix' : 'espaco'}`}>
      <Icon size={ICON_SIZE} />
    </div>
    <div className={`platform-card-badge platform-card-badge-${variant === 'flix' ? 'red' : 'indigo'}`}>
      {badge}
    </div>
    <h2>{title}</h2>
    <p>{description}</p>
    <div className={`platform-card-btn${variant === 'flix' ? ' platform-card-btn-red' : ''}`}>
      {buttonText}
    </div>
  </Link>
);

const CARDS: PlatformCardProps[] = [
  {
    title: 'VestWebFlix',
    description: 'Assista as melhores vídeoaulas dos nossos professores, organizadas por disciplina e tópico.',
    badge: 'Videoaulas',
    buttonText: 'Acessar VestWebFlix',
    href: '/VestWebFlix',
    icon: Play,
    variant: 'flix',
  },
  {
    title: 'Espaço Aluno',
    description: 'Questões, simulados, calendário de revisão, mentoria, comunidade e muito mais.',
    badge: 'Sala de Aula',
    buttonText: 'Acessar Espaço Aluno',
    href: '/classroom/home',
    icon: GraduationCap,
    variant: 'primary' as const,
  },
];

const SelectPlatform = () => {
  const { user: student } = useSelector((state: RootState) => state.auth);
  const firstName = student?.name?.split(' ')[0] ?? 'Aluno';

  return (
    <div className="select-platform">
      {/* fetchpriority="high" tells the browser this is the LCP candidate — prioritize it */}
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        className="select-platform-hero-img"
        fetchpriority="high"
        loading="eager"
        decoding="async"
      />
      <div className="select-platform-bg" />
      <div className="select-platform-inner">
        <div className="select-platform-logo">
          <img src={logo} alt="VestWeb" className="select-platform-logo-img" />
        </div>

        <Link to="/" className="select-platform-back-btn">
          <ArrowLeft size={16} />
          Voltar para home
        </Link>

        <h1>Olá, {firstName}!</h1>
        <p>Escolha por onde você quer começar hoje.</p>

        <div className="select-platform-cards">
          {CARDS.map(card => <PlatformCard key={card.href} {...card} />)}
        </div>
      </div>
    </div>
  );
};

export default SelectPlatform;
