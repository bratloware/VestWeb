import { Router } from 'express';
import {
  createCheckoutSession,
  handleWebhook,
  createPortalSession,
  getSubscription,
} from '../controllers/paymentController.js';

const router = Router();

// Rota pública — recebe eventos do Stripe (raw body configurado em app.js)
router.post('/webhook', handleWebhook);

// Rota pública — cria sessão de checkout
router.post('/create-checkout-session', createCheckoutSession);

// Consultar assinatura por e-mail
router.get('/subscription', getSubscription);

// Portal de gerenciamento de assinatura
router.post('/portal', createPortalSession);

export default router;
