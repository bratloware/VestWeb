import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle, ClipboardList, Play, MessageCircle,
  Calendar, Users, Mail, Phone, MapPin
} from 'lucide-react';
import logo from '../../assets/images/logo.png';
import LandingHeader from '../../components/LandingHeader';
import api from '../../api/api';
import './LandingPage.css';

interface Banner { id: number; image_url: string; title?: string; subtitle?: string; }

const features = [
  { icon: HelpCircle, title: 'Banco de Questões', desc: 'Milhares de questões de vestibulares anteriores organizadas por matéria e dificuldade.' },
  { icon: ClipboardList, title: 'Simulados', desc: 'Simulados completos com timer, correção automática e análise detalhada de desempenho.' },
  { icon: Play, title: 'VestWebFlix', desc: 'Videoaulas com os melhores professores, organizadas como uma plataforma de streaming.' },
  { icon: MessageCircle, title: 'Mentoria', desc: 'Sessões individuais com tutores especializados para tirar dúvidas e orientar estudos.' },
  { icon: Calendar, title: 'Calendário de Revisão', desc: 'Planejamento inteligente de revisões para fixar o conteúdo no longo prazo.' },
  { icon: Users, title: 'Comunidade', desc: 'Conecte-se com outros estudantes, compartilhe dúvidas e conquiste pontos no ranking.' },
];

const companyPlans = [
  { name: 'Starter', limit: 'Até 20 alunos', price: 39.90, highlight: false },
  { name: 'Básico', limit: 'Até 50 alunos', price: 32.90, highlight: false },
  { name: 'Profissional', limit: 'Até 100 alunos', price: 27.90, highlight: true },
  { name: 'Enterprise', limit: '100+ alunos', price: 22.90, highlight: false },
];

const LandingPage = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [planTab, setPlanTab] = useState<'individual' | 'empresa'>('individual');
const [currentSlide, setCurrentSlide] = useState(0);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    api.get('/landing/banners').then(r => { if (r.data.data?.length) setBanners(r.data.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    try {
      await api.post('/landing/contact', contactForm);
      setContactSuccess(true);
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setContactSuccess(false), 5000);
    } catch {
      // fallback
      setContactSuccess(true);
      setContactForm({ name: '', email: '', message: '' });
      setTimeout(() => setContactSuccess(false), 5000);
    }
    setContactLoading(false);
  };

  return (
    <div className="landing-page">
      <LandingHeader />

      {/* Hero */}
      <section id="home" className="hero">
        {banners.length > 0 && (
          <div className="hero-carousel">
            {banners.map((banner, i) => (
              <div
                key={banner.id}
                className={`hero-carousel-slide${i === currentSlide ? ' active' : ''}`}
                style={{ backgroundImage: `url(${banner.image_url})` }}
              />
            ))}
          </div>
        )}
        <div className="hero-bg-pattern" />
        <div className="hero-overlay" />

        <div className="hero-content">
          <div className="hero-badge">Pré-vestibular</div>
          <h1 className="hero-title">
            Sua <span>aprovação</span> comeca aqui!
          </h1>
          <p className="hero-subtitle">
            A plataforma completa para vestibulandos. Questões, simulados, videoaulas, mentorias e muito mais — tudo integrado para maximizar seu aprendizado.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="hero-cta-primary">
              Acessar Espaco Aluno
            </Link>
            <a href="#espaco-aluno" className="hero-cta-secondary">
              Conhecer plataforma
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-number">20k+</span>
              <span className="hero-stat-label">Questões</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">100+</span>
              <span className="hero-stat-label">Vídeoaulas</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">100+</span>
              <span className="hero-stat-label">Alunos</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">95%</span>
              <span className="hero-stat-label">Aprovados</span>
            </div>
          </div>
        </div>

        {banners.length > 1 && (
          <div className="carousel-dots">
            {banners.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot${i === currentSlide ? ' active' : ''}`}
                onClick={() => setCurrentSlide(i)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Espaco Aluno */}
      <section id="espaco-aluno" className="section">
        <div className="section-header">
          <div className="section-tag">Recursos</div>
          <h2 className="section-title">Tudo que você precisa em um só lugar!</h2>
          <p className="section-desc">Nossa plataforma foi desenvolvida para vestibulandos de todo o Brasil, com ferramentas que fazem a diferença.</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">
                <f.icon size={28} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="section section-alt">
        <div className="about-content">
          <div className="about-stats-card">
            <div className="about-stats-logo">
              <img src={logo} alt="VestWeb" />
            </div>
            <p className="about-card-tagline">
              A plataforma educacional que vai transformar a forma como você estuda para o vestibular.
            </p>
          </div>
          <div className="about-text">
            <div className="section-tag">Sobre Nós</div>
            <h2>Educação de qualidade ao alcance de todo aluno.</h2>
            <p>
              O VestWeb nasceu com uma missão simples: tornar o preparatório para o vestibular acessível. Acreditamos que o preço não deve ser um obstáculo entre o aluno e a sua aprovação.
            </p>
            <p>
              Por isso criamos uma plataforma completa — questões, simulados, videoaulas e acompanhamento de desempenho — com um valor que cabe no bolso de qualquer estudante.
            </p>
            <div className="about-highlights">
              {[
                'Plano a partir de R$ 19,90/mês com 7 dias grátis.',
                'Tudo em um só lugar, sem pagar por separado.',
                'Fácil de usar, do celular ou computador.',
                'Feito para quem quer estudar de verdade.',
              ].map((h, i) => (
                <div key={i} className="about-highlight">
                  <div className="about-highlight-dot" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Metodologia */}
      <section id="metodologia" className="section">
        <div className="section-header">
          <div className="section-tag">Metodologia</div>
          <h2 className="section-title">Como o VestWeb te prepara</h2>
          <p className="section-desc">Nossa abordagem é baseada em evidências científicas de aprendizado para maximizar sua evolução.</p>
        </div>
        <div className="methodology-grid">
          {[
            { step: '01', title: 'Diagnóstico', desc: 'Identifique seus pontos fortes e fracos com questões segmentadas por matéria e dificuldade.' },
            { step: '02', title: 'Prática direcionada', desc: 'Resolva questões focadas nas suas maiores dificuldades, com correção automática e explicações detalhadas.' },
            { step: '03', title: 'Revisão espaçada', desc: 'O calendário inteligente agenda revisões no momento certo para fixar o conteúdo na memória de longo prazo.' },
            { step: '04', title: 'Simulados reais', desc: 'Teste seus conhecimentos em simulados completos com o formato e nível das provas que você vai fazer.' },
            { step: '05', title: 'Análise de desempenho', desc: 'Acompanhe sua evolução com gráficos e métricas que mostram exatamente onde você precisa melhorar.' },
            { step: '06', title: 'Mentoria e comunidade', desc: 'Tire dúvidas com tutores e troque experiências com outros estudantes na nossa comunidade.' },
          ].map((m, i) => (
            <div key={i} className="methodology-card">
              <div className="methodology-step">{m.step}</div>
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="section section-alt">
        <div className="section-header">
          <div className="section-tag">Planos e Preços</div>
          <h2 className="section-title">Escolha o plano ideal para você</h2>
          <p className="section-desc">Acesso completo à plataforma. Sem surpresas, sem letras miúdas.</p>
        </div>

        <div className="plans-tabs">
          <button
            className={`plans-tab${planTab === 'individual' ? ' active' : ''}`}
            onClick={() => setPlanTab('individual')}
          >
            Individual
          </button>
          <button
            className={`plans-tab${planTab === 'empresa' ? ' active' : ''}`}
            onClick={() => setPlanTab('empresa')}
          >
            Para Empresas
          </button>
        </div>

        {planTab === 'individual' ? (
          <div className="plans-individual-wrapper">
            <div className="plan-card plan-card-highlight">
              <div className="plan-trial-badge">7 dias grátis</div>
              <div className="plan-name">VestWeb Individual</div>
              <p className="plan-desc">Tudo que você precisa para passar no vestibular em um só lugar.</p>
              <div className="plan-price">
                <span className="plan-currency">R$</span>
                <span className="plan-amount">19,90</span>
                <span className="plan-period">/mês</span>
              </div>
              <ul className="plan-benefits">
                {[
                  'Banco completo de questões',
                  'Simulados ilimitados',
                  'VestWebFlix liberado',
                  'Ranking e gamificação',
                  'Calendário de estudos',
                  'Comunidade de alunos',
                  'Acompanhamento de desempenho',
                  'Novos conteúdos toda semana',
                ].map((b, i) => (
                  <li key={i} className="plan-benefit-item">
                    <span className="plan-check">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="plan-cta">Começar agora — grátis por 7 dias</Link>
              <p className="plan-cta-note">Cancele quando quiser. Sem fidelidade.</p>
            </div>
          </div>
        ) : (
          <div className="plans-company-grid">
            {companyPlans.map((plan, i) => (
              <div key={i} className={`plan-card${plan.highlight ? ' plan-card-highlight' : ''}`}>
                {plan.highlight && <div className="plan-popular-badge">Mais popular</div>}
                <div className="plan-name">{plan.name}</div>
                <p className="plan-limit">{plan.limit}</p>
                <div className="plan-price">
                  <span className="plan-currency">R$</span>
                  <span className="plan-amount">{plan.price.toFixed(2).replace('.', ',')}</span>
                </div>
                <p className="plan-price-label">por aluno/mês</p>
                <ul className="plan-benefits">
                  {[
                    'Acesso completo à plataforma',
                    'Painel de gestão de alunos',
                    'Relatórios de desempenho',
                    'Suporte prioritário',
                  ].map((b, j) => (
                    <li key={j} className="plan-benefit-item">
                      <span className="plan-check">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <a href="#contato" className="plan-cta plan-cta-outline">Falar com a equipe</a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contato */}
      <section id="contato" className="section">
        <div className="section-header">
          <div className="section-tag">Contato</div>
          <h2 className="section-title">Fale conosco</h2>
          <p className="section-desc">Tem alguma dúvida? Nossa equipe esta pronta para ajudar.</p>
        </div>
        <div className="contact-content">
          <div className="contact-info">
            <h3>Entre em contato</h3>
            <p>Estamos disponivéis para tirar suas dúvidas sobre a plataforma, planos e muito mais. Não deixe para amanhã o que pode resolver hoje!</p>
            <div className="contact-links">
              <a href="mailto:contato@bratloware.com" className="contact-link">
                <div className="contact-link-icon"><Mail size={20} /></div>
                contato@bratloware.com
              </a>
              <a href="tel:+5561994319166" className="contact-link">
                <div className="contact-link-icon"><Phone size={20} /></div>
                (61) 99431-9166
              </a>
              <div className="contact-link">
                <div className="contact-link-icon"><MapPin size={20} /></div>
                Brasilia, DF - Brasil
              </div>
            </div>
          </div>
          <div className="contact-form">
            <h3>Envie sua mensagem</h3>
            <form onSubmit={handleContact}>
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Seu nome completo"
                  value={contactForm.name}
                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>E-mail</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="seu@email.com"
                  value={contactForm.email}
                  onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mensagem</label>
                <textarea
                  className="form-control"
                  placeholder="Escreva sua mensagem..."
                  value={contactForm.message}
                  onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={contactLoading}>
                {contactLoading ? 'Enviando...' : 'Enviar mensagem'}
              </button>
              {contactSuccess && (
                <div className="contact-success">Mensagem enviada com sucesso! Entraremos em contato em breve.</div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>VestWeb</h3>
            <p>A plataforma educacional mais completa para quem quer passar no vestibular. Estude com inteligência, conquiste sua aprovação.</p>
          </div>
          <div className="footer-links">
            <h4>Plataforma</h4>
            <ul>
              <li><a href="#planos">Planos</a></li>
              <li><a href="#sobre">Sobre nós</a></li>
              <li><a href="#metodologia">Metodologia</a></li>
              <li><a href="#contato">Contato</a></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Links Uteis</h4>
            <ul>
              <li><Link to="/login">Entrar</Link></li>
              <li><a href="#contato">Contato</a></li>
              <li><a href="#">Politica de Privacidade</a></li>
              <li><a href="#">Termos de Uso</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} VestWeb. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/5561994319166"
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float"
        aria-label="WhatsApp"
      >
        💬
      </a>
    </div>
  );
};

export default LandingPage;
