import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home } from 'lucide-react';
import './PaymentSuccess.css';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 500);
    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <div className="payment-result-page">
      <div className="payment-result-card">
        <div className="payment-success-icon">
          <CheckCircle size={56} strokeWidth={1.5} />
        </div>

        <h1>Pagamento confirmado!</h1>
        <p className="payment-result-desc">
          Sua assinatura foi ativada com sucesso. Você já pode acessar todos os recursos da plataforma.
        </p>

        {sessionId && (
          <p className="payment-result-session">
            Processando acesso{dots}
          </p>
        )}

        <div className="payment-result-actions">
          <Link to="/login" className="payment-btn-primary">
            Acessar a plataforma
            <ArrowRight size={18} />
          </Link>
          <Link to="/" className="payment-btn-secondary">
            <Home size={16} />
            Página inicial
          </Link>
        </div>

        <p className="payment-result-note">
          Você receberá um e-mail de confirmação em breve. Em caso de dúvidas, entre em contato pelo{' '}
          <a href="mailto:contato@bratloware.com">contato@bratloware.com</a>.
        </p>
      </div>
    </div>
  );
}
