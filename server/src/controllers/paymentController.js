import Stripe from 'stripe';
import { Subscription } from '../db/models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Preços em centavos (BRL)
const INDIVIDUAL_PRICES = {
  mensal:     { amount: 1990,  interval: 'month', interval_count: 1 },
  trimestral: { amount: 5370,  interval: 'month', interval_count: 3 },
  anual:      { amount: 15900, interval: 'year',  interval_count: 1 },
};

const COMPANY_PRICES_PER_STUDENT = {
  Starter:       3990,
  Básico:        3290,
  Profissional:  2790,
  Enterprise:    2290,
};

const BILLING_PERIOD_MULTIPLIER = {
  mensal:     { months: 1,  discount: 1.00 },
  trimestral: { months: 3,  discount: 0.90 },
  anual:      { months: 12, discount: 0.67 },
};

function getCompanyAmount(planTier, billingPeriod, numStudents) {
  const pricePerStudent = COMPANY_PRICES_PER_STUDENT[planTier];
  if (!pricePerStudent) return null;
  const { months, discount } = BILLING_PERIOD_MULTIPLIER[billingPeriod];
  return Math.round(pricePerStudent * months * numStudents * discount);
}

// POST /api/payments/create-pix-session  (pagamento único — PIX não suporta recorrência)
export const createPixCheckoutSession = async (req, res) => {
  try {
    const {
      planType,
      planTier,
      billingPeriod,
      name,
      email,
      numStudents,
      companyName,
    } = req.body;

    if (!planType || !billingPeriod || !email || !name) {
      return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    let unitAmount;
    let productName;

    if (planType === 'individual') {
      const price = INDIVIDUAL_PRICES[billingPeriod];
      if (!price) return res.status(400).json({ message: 'Período de cobrança inválido.' });
      unitAmount = price.amount;
      productName = `VestWeb Individual — ${billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1)}`;
    } else if (planType === 'empresa') {
      const students = parseInt(numStudents) || 1;
      unitAmount = getCompanyAmount(planTier, billingPeriod, students);
      if (!unitAmount) return res.status(400).json({ message: 'Plano inválido.' });
      productName = `VestWeb ${planTier} — ${billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1)} (${parseInt(numStudents) || 1} alunos)`;
    } else {
      return res.status(400).json({ message: 'Tipo de plano inválido.' });
    }

    // Calcula data de expiração do acesso com base no período escolhido
    const periodMonths = { mensal: 1, trimestral: 3, anual: 12 };
    const accessEndDate = new Date();
    accessEndDate.setMonth(accessEndDate.getMonth() + (periodMonths[billingPeriod] || 1));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['pix'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: productName,
            description: planType === 'individual'
              ? 'Acesso completo à plataforma VestWeb'
              : `Plano empresarial VestWeb para ${numStudents || 1} aluno(s)`,
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/cancel`,
      metadata: {
        plan_type: planType,
        plan_tier: planTier || 'individual',
        billing_period: billingPeriod,
        customer_name: name,
        customer_email: email,
        num_students: (numStudents || 1).toString(),
        company_name: companyName || '',
        access_end_date: accessEndDate.toISOString(),
        payment_method: 'pix',
      },
      locale: 'pt-BR',
      expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // QR Code válido por 24h
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe createPixCheckoutSession error:', err);
    res.status(500).json({ message: 'Erro ao criar sessão PIX.' });
  }
};

// POST /api/payments/create-checkout-session
export const createCheckoutSession = async (req, res) => {
  try {
    const {
      planType,      // 'individual' | 'empresa'
      planTier,      // 'individual' | 'Starter' | 'Básico' | 'Profissional' | 'Enterprise'
      billingPeriod, // 'mensal' | 'trimestral' | 'anual'
      name,
      email,
      numStudents,
      companyName,
    } = req.body;

    if (!planType || !billingPeriod || !email || !name) {
      return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    let lineItems;
    let productName;
    let unitAmount;
    let recurring;
    let trialDays = 0;

    if (planType === 'individual') {
      const price = INDIVIDUAL_PRICES[billingPeriod];
      if (!price) return res.status(400).json({ message: 'Período de cobrança inválido.' });

      unitAmount = price.amount;
      recurring = { interval: price.interval, interval_count: price.interval_count };
      productName = `VestWeb Individual — ${billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1)}`;
      trialDays = 7;

    } else if (planType === 'empresa') {
      const students = parseInt(numStudents) || 1;
      unitAmount = getCompanyAmount(planTier, billingPeriod, students);
      if (!unitAmount) return res.status(400).json({ message: 'Plano inválido.' });

      const { interval, interval_count } = billingPeriod === 'anual'
        ? { interval: 'year', interval_count: 1 }
        : { interval: 'month', interval_count: billingPeriod === 'trimestral' ? 3 : 1 };

      recurring = { interval, interval_count };
      productName = `VestWeb ${planTier} — ${billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1)} (${students} alunos)`;

    } else {
      return res.status(400).json({ message: 'Tipo de plano inválido.' });
    }

    lineItems = [{
      price_data: {
        currency: 'brl',
        product_data: {
          name: productName,
          description: planType === 'individual'
            ? 'Acesso completo à plataforma VestWeb'
            : `Plano empresarial VestWeb para ${numStudents || 1} aluno(s)`,
        },
        unit_amount: unitAmount,
        recurring,
      },
      quantity: 1,
    }];

    const sessionConfig = {
      payment_method_types: ['card'],
      customer_email: email,
      line_items: lineItems,
      mode: 'subscription',
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/cancel`,
      metadata: {
        plan_type: planType,
        plan_tier: planTier || 'individual',
        billing_period: billingPeriod,
        customer_name: name,
        customer_email: email,
        num_students: (numStudents || 1).toString(),
        company_name: companyName || '',
      },
      locale: 'pt-BR',
    };

    if (trialDays > 0) {
      sessionConfig.subscription_data = { trial_period_days: trialDays };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe createCheckoutSession error:', err);
    res.status(500).json({ message: 'Erro ao criar sessão de pagamento.' });
  }
};

// POST /api/payments/webhook  (raw body obrigatório — configurado em app.js)
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const meta = session.metadata || {};
        const isPix = meta.payment_method === 'pix';

        // Para PIX: só processa se o pagamento foi confirmado
        // Para assinaturas: processa mesmo em trial (payment_status = 'no_payment_required')
        const isPaid = session.payment_status === 'paid';
        const isTrialing = session.payment_status === 'no_payment_required';
        if (!isPaid && !isTrialing) break;

        const currentPeriodEnd = isPix && meta.access_end_date
          ? new Date(meta.access_end_date)
          : null;

        const subscriptionData = {
          customer_email: meta.customer_email || session.customer_email,
          customer_name: meta.customer_name || '',
          stripe_customer_id: session.customer,
          stripe_subscription_id: isPix ? null : session.subscription,
          stripe_session_id: session.id,
          plan_type: meta.plan_type || 'individual',
          plan_tier: meta.plan_tier || 'individual',
          billing_period: meta.billing_period || 'mensal',
          status: isPaid ? 'active' : 'trialing',
          student_count: parseInt(meta.num_students) || 1,
          company_name: meta.company_name || null,
          current_period_end: currentPeriodEnd,
        };

        if (isPix) {
          // PIX é pagamento único — verifica por session_id para evitar duplicata
          const existing = await Subscription.findOne({ where: { stripe_session_id: session.id } });
          if (!existing) await Subscription.create(subscriptionData);
        } else {
          await Subscription.upsert(subscriptionData, { conflictFields: ['stripe_subscription_id'] });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        await Subscription.update(
          {
            status: sub.status,
            current_period_end: new Date(sub.current_period_end * 1000),
          },
          { where: { stripe_subscription_id: sub.id } }
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await Subscription.update(
          { status: 'canceled' },
          { where: { stripe_subscription_id: sub.id } }
        );
        break;
      }

      // PIX pago de forma assíncrona (usuário fechou a tela e pagou depois)
      case 'payment_intent.succeeded': {
        const pi = event.data.object;
        // Atualiza status caso a subscription tenha sido criada mas ainda estava pendente
        await Subscription.update(
          { status: 'active' },
          { where: { stripe_session_id: pi.metadata?.session_id || '', status: 'incomplete' } }
        );
        break;
      }

      default:
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ message: 'Erro interno ao processar webhook.' });
  }
};

// POST /api/payments/portal  (requer autenticação)
export const createPortalSession = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'E-mail obrigatório.' });

    const subscription = await Subscription.findOne({
      where: { customer_email: email, status: ['active', 'trialing', 'past_due'] },
      order: [['created_at', 'DESC']],
    });

    if (!subscription?.stripe_customer_id) {
      return res.status(404).json({ message: 'Nenhuma assinatura ativa encontrada.' });
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${clientUrl}/classroom/settings`,
    });

    res.json({ url: portal.url });
  } catch (err) {
    console.error('Portal session error:', err);
    res.status(500).json({ message: 'Erro ao abrir portal de assinatura.' });
  }
};

// GET /api/payments/subscription?email=...
export const getSubscription = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'E-mail obrigatório.' });

    const subscription = await Subscription.findOne({
      where: { customer_email: email },
      order: [['created_at', 'DESC']],
    });

    if (!subscription) {
      return res.json({ subscription: null });
    }

    res.json({ subscription });
  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ message: 'Erro ao buscar assinatura.' });
  }
};
