import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft, Home } from 'lucide-react';
import '../PaymentSuccess/PaymentSuccess.css';

export default function PaymentCancel() {
  return (
    <div className="payment-result-page">
      <div className="payment-result-card">
        <div className="payment-error-icon">
          <XCircle size={56} strokeWidth={1.5} />
        </div>

        <h1>Pagamento cancelado</h1>
        <p className="payment-result-desc">
          Nenhuma cobrança foi realizada. Você pode voltar e escolher um plano quando quiser.
        </p>

        <div className="payment-result-actions">
          <Link to="/#planos" className="payment-btn-primary">
            <ArrowLeft size={18} />
            Ver planos novamente
          </Link>
          <Link to="/" className="payment-btn-secondary">
            <Home size={16} />
            Página inicial
          </Link>
        </div>

        <p className="payment-result-note">
          Precisa de ajuda? Fale conosco pelo{' '}
          <a href="mailto:contato@bratloware.com">contato@bratloware.com</a>.
        </p>
      </div>
    </div>
  );
}
