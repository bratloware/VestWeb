import Stripe from 'stripe';
import { randomUUID } from 'crypto';
import { Subscription, Student } from '../db/models/index.js';
import { hashPassword } from '../services/hashService.js';
import { sendVerificationEmail, sendEnrollmentEmail } from '../services/emailService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function generateEnrollment() {
  const random = Math.floor(10000000 + Math.random() * 90000000);
  return random.toString();
}

async function uniqueEnrollment() {
  let enrollment;
  let taken = true;
  while (taken) {
    enrollment = generateEnrollment();
    taken = !!(await Student.findOne({ where: { enrollment } }));
  }
  return enrollment;
}

// Cria o Student (ou atualiza token se já existir) e envia email de verificação
async function createStudentAndSendEmail({ name, email, password, targetVestibularId, stripeUrl }) {
  const password_hash = await hashPassword(password);
  const token = randomUUID();

  let student = await Student.findOne({ where: { email } });

  if (student) {
    // Já existe — atualiza token e URL do Stripe (nova tentativa de assinatura)
    await student.update({ token, stripe_session_url: stripeUrl });
  } else {
    const enrollment = await uniqueEnrollment();
    student = await Student.create({
      name,
      email,
      password_hash,
      enrollment,
      target_vestibular_id: targetVestibularId || null,
      role: 'student',
      token,
      stripe_session_url: stripeUrl,
    });
  }

  sendVerificationEmail({ to: email, name, token }).catch(err =>
    console.error('sendVerificationEmail error:', err)
  );
}

// Preços em centavos (BRL) por plano individual e período
const INDIVIDUAL_PLAN_PRICES = {
  Básico: { mensal: 1490, trimestral: 4023,  anual: 11988 },
  Plus:   { mensal: 2490, trimestral: 6723,  anual: 19992 },
  Pro:    { mensal: 3990, trimestral: 10773, anual: 32076 },
  Elite:  { mensal: 4490, trimestral: 12123, anual: 36084 },
};

const BILLING_INTERVAL = {
  mensal:     { interval: 'month', interval_count: 1 },
  trimestral: { interval: 'month', interval_count: 3 },
  anual:      { interval: 'year',  interval_count: 1 },
};

// POST /api/payments/create-pix-session
export const createPixCheckoutSession = async (req, res) => {
  try {
    const { planType, planTier, billingPeriod, name, email, password, targetVestibularId, numStudents, companyName } = req.body;

    if (!planType || !billingPeriod || !email || !name) {
      return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    }
    if (planType === 'individual' && !password) {
      return res.status(400).json({ message: 'Senha obrigatória.' });
    }
    if (planType !== 'individual') {
      return res.status(400).json({ message: 'Tipo de plano inválido.' });
    }

    const planPrices = INDIVIDUAL_PLAN_PRICES[planTier];
    if (!planPrices) return res.status(400).json({ message: 'Plano inválido.' });
    const unitAmount = planPrices[billingPeriod];
    if (!unitAmount) return res.status(400).json({ message: 'Período de cobrança inválido.' });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const productName = `VestWeb ${planTier} — ${billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1)}`;

    const periodMonths = { mensal: 1, trimestral: 3, anual: 12 };
    const accessEndDate = new Date();
    accessEndDate.setMonth(accessEndDate.getMonth() + (periodMonths[billingPeriod] || 1));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['pix'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: { name: productName, description: 'Acesso completo à plataforma VestWeb' },
          unit_amount: unitAmount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/cancel`,
      metadata: {
        plan_type: planType,
        plan_tier: planTier,
        billing_period: billingPeriod,
        customer_name: name,
        customer_email: email,
        num_students: (numStudents || 1).toString(),
        company_name: companyName || '',
        access_end_date: accessEndDate.toISOString(),
        payment_method: 'pix',
      },
      locale: 'pt-BR',
      expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    });

    await createStudentAndSendEmail({ name, email, password, targetVestibularId, stripeUrl: session.url });

    res.json({ requiresVerification: true });
  } catch (err) {
    console.error('Stripe createPixCheckoutSession error:', err);
    res.status(500).json({ message: 'Erro ao criar sessão PIX.' });
  }
};

// POST /api/payments/create-checkout-session
export const createCheckoutSession = async (req, res) => {
  try {
    const { planType, planTier, billingPeriod, name, email, password, targetVestibularId, numStudents, companyName } = req.body;

    if (!planType || !billingPeriod || !email || !name) {
      return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    }
    if (planType === 'individual' && !password) {
      return res.status(400).json({ message: 'Senha obrigatória.' });
    }
    if (planType !== 'individual') {
      return res.status(400).json({ message: 'Tipo de plano inválido.' });
    }

    const planPrices = INDIVIDUAL_PLAN_PRICES[planTier];
    if (!planPrices) return res.status(400).json({ message: 'Plano inválido.' });
    const unitAmount = planPrices[billingPeriod];
    if (!unitAmount) return res.status(400).json({ message: 'Período de cobrança inválido.' });

    const { interval, interval_count } = BILLING_INTERVAL[billingPeriod];
    const productName = `VestWeb ${planTier} — ${billingPeriod.charAt(0).toUpperCase() + billingPeriod.slice(1)}`;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: { name: productName, description: 'Acesso completo à plataforma VestWeb' },
          unit_amount: unitAmount,
          recurring: { interval, interval_count },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/cancel`,
      metadata: {
        plan_type: planType,
        plan_tier: planTier,
        billing_period: billingPeriod,
        customer_name: name,
        customer_email: email,
        num_students: (numStudents || 1).toString(),
        company_name: companyName || '',
      },
      locale: 'pt-BR',
    });

    await createStudentAndSendEmail({ name, email, password, targetVestibularId, stripeUrl: session.url });

    res.json({ requiresVerification: true });
  } catch (err) {
    console.error('Stripe createCheckoutSession error:', err);
    res.status(500).json({ message: 'Erro ao criar sessão de pagamento.' });
  }
};

// POST /api/payments/webhook
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
          const existing = await Subscription.findOne({ where: { stripe_session_id: session.id } });
          if (!existing) await Subscription.create(subscriptionData);
        } else {
          await Subscription.upsert(subscriptionData, { conflictFields: ['stripe_subscription_id'] });
        }

        // Student já existe — só envia email de matrícula
        if (meta.plan_type === 'individual') {
          const studentEmail = meta.customer_email || session.customer_email;
          const student = await Student.findOne({ where: { email: studentEmail } });
          if (student) {
            sendEnrollmentEmail({
              to: student.email,
              name: student.name,
              enrollment: student.enrollment,
              planTier: meta.plan_tier || '',
            }).catch(err => console.error('sendEnrollmentEmail error:', err));
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        await Subscription.update(
          { status: sub.status, current_period_end: new Date(sub.current_period_end * 1000) },
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

      case 'payment_intent.succeeded': {
        const pi = event.data.object;
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

// POST /api/payments/portal
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

    res.json({ subscription: subscription || null });
  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ message: 'Erro ao buscar assinatura.' });
  }
};
