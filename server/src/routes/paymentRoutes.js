import { Router } from 'express';
import {
  createCheckoutSession,
  createPixCheckoutSession,
  handleWebhook,
  createPortalSession,
  getSubscription,
} from '../controllers/paymentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { paymentRateLimit } from '../middlewares/rateLimitMiddleware.js';

const router = Router();

// Rota publica - recebe eventos do Stripe (raw body configurado em app.js)
router.post('/webhook', handleWebhook);

// Rotas publicas - criacao de sessao de checkout
router.post('/create-checkout-session', paymentRateLimit, createCheckoutSession);
router.post('/create-pix-session', paymentRateLimit, createPixCheckoutSession);

// Consultar assinatura do usuario autenticado
router.get('/subscription', authMiddleware, getSubscription);

// Portal de gerenciamento da assinatura do usuario autenticado
router.post('/portal', authMiddleware, createPortalSession);

export default router;
