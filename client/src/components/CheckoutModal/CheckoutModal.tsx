import { useState, useEffect } from 'react';
import { X, Lock, CreditCard, ChevronDown, QrCode } from 'lucide-react';
import api from '../../api/api';
import './CheckoutModal.css';

export type PlanType = 'individual' | 'empresa';
export type BillingPeriod = 'mensal' | 'trimestral' | 'anual';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: PlanType;
  planTier: string;
  billingPeriod: BillingPeriod;
  priceLabel: string;
  billingNote: string;
}

const BILLING_OPTIONS: { value: BillingPeriod; label: string; badge?: string }[] = [
  { value: 'mensal',     label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral', badge: '10% off' },
  { value: 'anual',      label: 'Anual',      badge: '33% off' },
];

const INDIVIDUAL_PRICES: Record<BillingPeriod, { amount: string; note: string }> = {
  mensal:     { amount: 'R$ 19,90/mês',  note: 'Cobrado mensalmente' },
  trimestral: { amount: 'R$ 17,90/mês',  note: 'Cobrado R$53,70 a cada 3 meses' },
  anual:      { amount: 'R$ 13,27/mês',  note: 'Cobrado R$159,00 por ano' },
};

const COMPANY_PRICES: Record<string, number> = {
  Starter: 39.90,
  Básico: 32.90,
  Profissional: 27.90,
  Enterprise: 22.90,
};

export default function CheckoutModal({
  isOpen,
  onClose,
  planType,
  planTier,
  billingPeriod: initialBillingPeriod,
}: CheckoutModalProps) {
  const [billing, setBilling] = useState<BillingPeriod>(initialBillingPeriod);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [numStudents, setNumStudents] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setBilling(initialBillingPeriod);
  }, [initialBillingPeriod]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const isEmpresa = planType === 'empresa';

  function getCompanyTotal() {
    const pricePerStudent = COMPANY_PRICES[planTier] ?? 39.90;
    const multipliers: Record<BillingPeriod, { months: number; discount: number }> = {
      mensal:     { months: 1,  discount: 1.00 },
      trimestral: { months: 3,  discount: 0.90 },
      anual:      { months: 12, discount: 0.67 },
    };
    const { months, discount } = multipliers[billing];
    const total = pricePerStudent * months * numStudents * discount;
    return total.toFixed(2).replace('.', ',');
  }

  function getPriceLabel() {
    if (isEmpresa) {
      const pricePerStudent = COMPANY_PRICES[planTier] ?? 39.90;
      return `R$ ${pricePerStudent.toFixed(2).replace('.', ',')}/aluno/mês`;
    }
    return INDIVIDUAL_PRICES[billing].amount;
  }

  function getBillingNote() {
    if (isEmpresa) {
      const total = getCompanyTotal();
      const periodLabel = { mensal: 'mês', trimestral: '3 meses', anual: 'ano' }[billing];
      return `Total: R$ ${total} a cada ${periodLabel} • ${numStudents} aluno(s)`;
    }
    return INDIVIDUAL_PRICES[billing].note;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim()) {
      setError('Por favor, preencha nome e e-mail.');
      return;
    }
    if (isEmpresa && !companyName.trim()) {
      setError('Por favor, informe o nome da empresa.');
      return;
    }

    const endpoint = paymentMethod === 'pix'
      ? '/payments/create-pix-session'
      : '/payments/create-checkout-session';

    setLoading(true);
    try {
      const { data } = await api.post(endpoint, {
        planType,
        planTier,
        billingPeriod: billing,
        name,
        email,
        numStudents: isEmpresa ? numStudents : 1,
        companyName: isEmpresa ? companyName : '',
      });

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('Erro ao iniciar o pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={e => e.stopPropagation()}>

        <button className="checkout-close" onClick={onClose} aria-label="Fechar">
          <X size={20} />
        </button>

        {/* Cabeçalho do plano */}
        <div className="checkout-header">
          <div className="checkout-plan-badge">
            {isEmpresa ? `Plano ${planTier}` : 'VestWeb Individual'}
          </div>
          <div className="checkout-price">{getPriceLabel()}</div>
          <p className="checkout-billing-note">{getBillingNote()}</p>
          {!isEmpresa && (
            <span className="checkout-trial">7 dias grátis inclusos</span>
          )}
        </div>

        {/* Seletor de método de pagamento */}
        <div className="checkout-payment-method">
          <button
            type="button"
            className={`checkout-method-btn${paymentMethod === 'card' ? ' active' : ''}`}
            onClick={() => setPaymentMethod('card')}
          >
            <CreditCard size={16} />
            Cartão
          </button>
          <button
            type="button"
            className={`checkout-method-btn${paymentMethod === 'pix' ? ' active' : ''}`}
            onClick={() => setPaymentMethod('pix')}
          >
            <QrCode size={16} />
            PIX
          </button>
        </div>

        {paymentMethod === 'pix' && (
          <p className="checkout-pix-note">
            PIX é pagamento único. O acesso é liberado automaticamente após a confirmação e renovado manualmente no próximo período.
          </p>
        )}

        {/* Toggle de período de cobrança */}
        <div className="checkout-billing-toggle">
          {BILLING_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`checkout-billing-btn${billing === opt.value ? ' active' : ''}`}
              onClick={() => setBilling(opt.value)}
            >
              {opt.label}
              {opt.badge && <span className="checkout-billing-badge">{opt.badge}</span>}
            </button>
          ))}
        </div>

        {/* Formulário */}
        <form className="checkout-form" onSubmit={handleSubmit}>
          <div className="checkout-field">
            <label>Nome completo</label>
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="checkout-field">
            <label>E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          {isEmpresa && (
            <>
              <div className="checkout-field">
                <label>Nome da empresa</label>
                <input
                  type="text"
                  placeholder="Ex: Colégio ABC"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  required
                />
              </div>

              <div className="checkout-field">
                <label>Número de alunos</label>
                <div className="checkout-students-wrapper">
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={numStudents}
                    onChange={e => setNumStudents(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                  />
                  <ChevronDown size={16} className="checkout-students-icon" />
                </div>
                <span className="checkout-field-hint">
                  Total estimado: R$ {getCompanyTotal()} /{billing === 'anual' ? 'ano' : billing === 'trimestral' ? '3 meses' : 'mês'}
                </span>
              </div>
            </>
          )}

          {error && <p className="checkout-error">{error}</p>}

          <button
            type="submit"
            className="checkout-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="checkout-spinner" />
            ) : paymentMethod === 'pix' ? (
              <>
                <QrCode size={18} />
                Gerar QR Code PIX
              </>
            ) : (
              <>
                <CreditCard size={18} />
                {isEmpresa ? 'Assinar agora' : '7 dias grátis — Assinar'}
              </>
            )}
          </button>

          <p className="checkout-secure">
            <Lock size={12} />
            Pagamento seguro via Stripe. Cancele quando quiser.
          </p>
        </form>
      </div>
    </div>
  );
}
