import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Menu, X } from 'lucide-react';
import './LandingHeader.css';

const LandingHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#home', label: 'Início' },
    { href: '#colaboradores', label: 'Colaboradores' },
    { href: '#espaco-aluno', label: 'Espaço Aluno' },
    { href: '#sobre', label: 'Sobre' },
    { href: '#depoimentos', label: 'Depoimentos' },
    { href: '#contato', label: 'Contato' },
  ];

  const handleNavClick = () => setMenuOpen(false);

  return (
    <>
      <header className={`landing-header${scrolled ? ' scrolled' : ''}`}>
        {/* Bloco 1: Lado Esquerdo (Logo) */}
        <div className="landing-header-left">
          <Link to="/" className="landing-header-logo">
            <div className="landing-header-logo-icon">
              <Brain size={22} />
            </div>
            <span className="landing-header-logo-text">THE BEST</span>
          </Link>
        </div>

        {/* Bloco 2: Centro (Apenas os links de texto) */}
        <nav className="landing-header-nav-container">
          <ul className="landing-header-nav">
            {navLinks.map(link => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bloco 3: Lado Direito (Botão Verde Água e Hamburger) */}
        <div className="landing-header-right">
          <Link to="/login" className="landing-header-cta">
            Acessar Espaço Aluno
          </Link>
          
          <button
            className="landing-header-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Menu Mobile - Mantém a estrutura original para não quebrar funcionalidade */}
      <div className={`landing-mobile-menu${menuOpen ? ' open' : ''}`}>
        {navLinks.map(link => (
          <a key={link.href} href={link.href} onClick={handleNavClick}>{link.label}</a>
        ))}
        <Link to="/login" className="landing-header-cta" onClick={handleNavClick}>
          Acessar Espaço Aluno
        </Link>
      </div>
    </>
  );
};

export default LandingHeader;
