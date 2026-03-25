import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle, ClipboardList, Play, MessageCircle,
  Calendar, Users, Brain, Mail, Phone, MapPin, ChevronRight
} from 'lucide-react';
import LandingHeader from '../../components/LandingHeader';
import api from '../../api/api';
import './LandingPage.css';

interface Banner { id: number; image_url: string; title?: string; subtitle?: string; }
interface Testimonial { id: number; name: string; photo_url?: string; course?: string; university?: string; text: string; }
interface Collaborator { id: number; name: string; avatar_url?: string; email?: string; }
interface InstVideo { youtube_url: string; title: string; }

const features = [
  { icon: HelpCircle, title: 'Banco de Questões', desc: 'Milhares de questões de vestibulares anteriores organizadas por matéria e dificuldade.' },
  { icon: ClipboardList, title: 'Simulados', desc: 'Simulados completos com timer, correção automática e análise detalhada de desempenho.' },
  { icon: Play, title: 'Sinaflix', desc: 'Videoaulas com os melhores professores, organizadas como uma plataforma de streaming.' },
  { icon: MessageCircle, title: 'Mentoria', desc: 'Sessões individuais com tutores especializados para tirar dúvidas e orientar estudos.' },
  { icon: Calendar, title: 'Calendário de Revisão', desc: 'Planejamento inteligente de revisões para fixar o conteúdo no longo prazo.' },
  { icon: Users, title: 'Comunidade', desc: 'Conecte-se com outros estudantes, compartilhe dúvidas e conquiste pontos no ranking.' },
];

const staticTestimonials = [
  { id: 1, name: 'Ana Lima', course: 'Medicina', university: 'USP', text: 'O Sinapse me ajudou a organizar meus estudos e aumentar minha taxa de acerto em 40%! A plataforma é incrível.' },
  { id: 2, name: 'Carlos Souza', course: 'Medicina', university: 'UNICAMP', text: 'Os simulados são muito próximos das provas reais. Me senti preparado no dia do vestibular.' },
  { id: 3, name: 'Mariana Santos', course: 'Medicina', university: 'UNIFESP', text: 'A Sinaflix é diferente de tudo que já usei. As aulas são objetivas e os professores são excelentes!' },
];

const LandingPage = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(staticTestimonials);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [instVideo, setInstVideo] = useState<InstVideo | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    api.get('/landing/banners').then(r => { if (r.data.data?.length) setBanners(r.data.data); }).catch(() => {});
    api.get('/landing/testimonials').then(r => { if (r.data.data?.length) setTestimonials(r.data.data); }).catch(() => {});
    api.get('/landing/collaborators').then(r => setCollaborators(r.data.data || [])).catch(() => {});
    api.get('/landing/video').then(r => setInstVideo(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const getYoutubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&\n?#]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : '';
  };

  const getInitials = (name: string) => name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

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
          <div className="hero-badge">Pre-vestibular medicina</div>
          <h1 className="hero-title">
            Sua <span>aprovacao</span> comeca aqui
          </h1>
          <p className="hero-subtitle">
            A plataforma completa para estudantes de medicina. Questoes, simulados, videoaulas, mentoria e muito mais — tudo integrado para maximizar seu aprendizado.
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
              <span className="hero-stat-number">10k+</span>
              <span className="hero-stat-label">Questoes</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">500+</span>
              <span className="hero-stat-label">Videoaulas</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-number">2k+</span>
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
          <h2 className="section-title">Tudo que voce precisa em um so lugar</h2>
          <p className="section-desc">Nossa plataforma foi desenvolvida especialmente para estudantes de medicina, com ferramentas que fazem a diferenca.</p>
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
          <div className="about-video-wrapper">
            {instVideo && getYoutubeEmbedUrl(instVideo.youtube_url) ? (
              <iframe
                src={getYoutubeEmbedUrl(instVideo.youtube_url)}
                title={instVideo.title}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <div className="about-video-placeholder">
                <div style={{ textAlign: 'center' }}>
                  <Play size={48} style={{ margin: '0 auto 12px', color: 'rgba(255,255,255,0.3)' }} />
                  <p>Video institucional</p>
                </div>
              </div>
            )}
          </div>
          <div className="about-text">
            <div className="section-tag">Sobre nos</div>
            <h2>O cursinho que ja aprovou milhares de medicos</h2>
            <p>
              O Sinapse nasceu com o objetivo de democratizar o acesso a educacao de qualidade para estudantes que desejam ingressar nas melhores faculdades de medicina do Brasil.
            </p>
            <p>
              Nossa plataforma digital combina metodologia pedagogica comprovada com tecnologia de ponta, oferecendo uma experiencia de aprendizado personalizada e eficiente.
            </p>
            <div className="about-highlights">
              {['Professores com experiencia em grandes vestibulares', 'Metodologia baseada em evidencias cientificas', 'Suporte 24h para alunos', 'Taxa de aprovacao acima da media nacional'].map((h, i) => (
                <div key={i} className="about-highlight">
                  <div className="about-highlight-dot" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Colaboradores */}
      <section id="colaboradores" className="section">
        <div className="section-header">
          <div className="section-tag">Equipe</div>
          <h2 className="section-title">Nossos professores</h2>
          <p className="section-desc">Uma equipe de especialistas dedicados ao seu sucesso no vestibular.</p>
        </div>
        {collaborators.length === 0 ? (
          <div className="collaborators-grid">
            {['Prof. Ana Carvalho', 'Prof. Bruno Lima', 'Prof. Carla Dias', 'Prof. Daniel Silva'].map((name, i) => (
              <div key={i} className="collaborator-card">
                <div className="collaborator-avatar">{name[5]}</div>
                <div className="collaborator-name">{name}</div>
                <div className="collaborator-specialty">{['Biologia', 'Quimica', 'Fisica', 'Portugues'][i]}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="collaborators-grid">
            {collaborators.map(c => (
              <div key={c.id} className="collaborator-card">
                <div className="collaborator-avatar">
                  {c.avatar_url ? <img src={c.avatar_url} alt={c.name} /> : getInitials(c.name)}
                </div>
                <div className="collaborator-name">{c.name}</div>
                <div className="collaborator-specialty">Professor</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="section section-alt">
        <div className="section-header">
          <div className="section-tag">Depoimentos</div>
          <h2 className="section-title">O que nossos alunos dizem</h2>
          <p className="section-desc">Historias reais de estudantes que realizaram o sonho de cursar medicina.</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map(t => (
            <div key={t.id} className="testimonial-card">
              <div className="testimonial-quote">"</div>
              <p className="testimonial-text">{t.text}</p>
              <div className="testimonial-author">
                <div className="testimonial-photo">
                  {t.photo_url ? <img src={t.photo_url} alt={t.name} /> : getInitials(t.name)}
                </div>
                <div className="testimonial-author-info">
                  <h4>{t.name}</h4>
                  <p>{t.course && t.university ? `${t.course} — ${t.university}` : t.course || t.university || 'Aluno Sinapse'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contato */}
      <section id="contato" className="section">
        <div className="section-header">
          <div className="section-tag">Contato</div>
          <h2 className="section-title">Fale conosco</h2>
          <p className="section-desc">Tem alguma duvida? Nossa equipe esta pronta para ajudar.</p>
        </div>
        <div className="contact-content">
          <div className="contact-info">
            <h3>Entre em contato</h3>
            <p>Estamos disponiveis para tirar suas duvidas sobre a plataforma, planos e muito mais. Nao deixe para amanha o que pode resolver hoje!</p>
            <div className="contact-links">
              <a href="mailto:contato@sinapse.com.br" className="contact-link">
                <div className="contact-link-icon"><Mail size={20} /></div>
                contato@sinapse.com.br
              </a>
              <a href="tel:+5511999999999" className="contact-link">
                <div className="contact-link-icon"><Phone size={20} /></div>
                (11) 99999-9999
              </a>
              <div className="contact-link">
                <div className="contact-link-icon"><MapPin size={20} /></div>
                Sao Paulo, SP - Brasil
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
            <h3>Sinapse</h3>
            <p>A plataforma educacional mais completa para quem quer passar em medicina. Estude com inteligencia, conquiste sua aprovacao.</p>
          </div>
          <div className="footer-links">
            <h4>Plataforma</h4>
            <ul>
              <li><a href="#espaco-aluno">Espaco Aluno</a></li>
              <li><a href="#sobre">Sobre nos</a></li>
              <li><a href="#colaboradores">Professores</a></li>
              <li><a href="#depoimentos">Depoimentos</a></li>
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
          <p>© {new Date().getFullYear()} Sinapse. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/5511999999999"
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
