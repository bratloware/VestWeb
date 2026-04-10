import { Router } from 'express';
import { login, teacherLogin, me, logout } from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { Student } from '../db/models/index.js';

const router = Router();

router.post('/login', login);
router.post('/teacher-login', teacherLogin);
router.get('/me', authMiddleware, me);
router.post('/logout', authMiddleware, logout);

// GET /api/auth/verify-email?token=xxx
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  if (!token) {
    return res.redirect(`${clientUrl}/verify-email?status=invalid`);
  }

  const student = await Student.findOne({ where: { token } });

  if (!student) {
    return res.redirect(`${clientUrl}/verify-email?status=invalid`);
  }

  const stripeUrl = student.stripe_session_url;

  // Zera o token e a URL temporária
  await student.update({ token: null, stripe_session_url: null });

  // Redireciona direto pro Stripe
  return res.redirect(stripeUrl || `${clientUrl}/verify-email?status=success`);
});

export default router;
