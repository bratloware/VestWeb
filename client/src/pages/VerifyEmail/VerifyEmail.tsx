import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import '../PaymentSuccess/PaymentSuccess.css';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');

  if (status === 'success') {
    return (
      <div className="payment-result-page">
        <div className="payment-result-card">
          <div className="payment-success-icon">
            <CheckCircle size={56} strokeWidth={1.5} />
          </div>
          <h1>E-mail confirmado!</h1>
          <p className="payment-result-desc">
            Seu e-mail foi verificado com sucesso. Após a confirmação do pagamento você receberá sua matrícula por e-mail.
          </p>
          <div className="payment-result-actions">
            <Link to="/" className="payment-btn-primary">Voltar ao início</Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="payment-result-page">
        <div className="payment-result-card">
          <div className="payment-error-icon">
            <XCircle size={56} strokeWidth={1.5} />
          </div>
          <h1>Link inválido</h1>
          <p className="payment-result-desc">
            Este link de confirmação é inválido ou já foi utilizado.
          </p>
          <div className="payment-result-actions">
            <Link to="/" className="payment-btn-secondary">Voltar ao início</Link>
          </div>
        </div>
      </div>
    );
  }

  // Nenhum status — usuário acessou /verify-email diretamente
  return (
    <div className="payment-result-page">
      <div className="payment-result-card">
        <div style={{ color: '#4f46e5', marginBottom: '1.5rem' }}>
          <Mail size={56} strokeWidth={1.5} />
        </div>
        <h1>Confirme seu e-mail</h1>
        <p className="payment-result-desc">
          Acesse o link enviado para o seu e-mail para confirmar seu cadastro.
        </p>
        <div className="payment-result-actions">
          <Link to="/" className="payment-btn-secondary">Voltar ao início</Link>
        </div>
      </div>
    </div>
  );
}
