import { Router } from 'express';
import {
  createCheckoutSession,
  createPixCheckoutSession,
  handleWebhook,
  createPortalSession,
  getSubscription,
} from '../controllers/paymentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

// Rota pública — recebe eventos do Stripe (raw body configurado em app.js)
router.post('/webhook', handleWebhook);

// Rota pública — cria sessão de checkout (cartão/assinatura recorrente)
router.post('/create-checkout-session', createCheckoutSession);

// Rota pública — cria sessão PIX (pagamento único)
router.post('/create-pix-session', createPixCheckoutSession);

// Consultar assinatura do usuario autenticado
router.get('/subscription', authMiddleware, getSubscription);

// Portal de gerenciamento da assinatura do usuario autenticado
router.post('/portal', authMiddleware, createPortalSession);

export default router;
