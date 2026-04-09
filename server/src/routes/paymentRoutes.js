import { Router } from 'express';
import {
  createCheckoutSession,
  createPixCheckoutSession,
  handleWebhook,
  createPortalSession,
  getSubscription,
} from '../controllers/paymentController.js';

const router = Router();

// Rota pública — recebe eventos do Stripe (raw body configurado em app.js)
router.post('/webhook', handleWebhook);

// Rota pública — cria sessão de checkout (cartão/assinatura recorrente)
router.post('/create-checkout-session', createCheckoutSession);

// Rota pública — cria sessão PIX (pagamento único)
router.post('/create-pix-session', createPixCheckoutSession);

// Consultar assinatura por e-mail
router.get('/subscription', getSubscription);

// Portal de gerenciamento de assinatura
router.post('/portal', createPortalSession);

export default router;
