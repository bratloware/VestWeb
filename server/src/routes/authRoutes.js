import { Router } from 'express';
import { login, teacherLogin, me, logout } from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/teacher-login', teacherLogin);
router.get('/me', authMiddleware, me);
router.post('/logout', authMiddleware, logout);

export default router;
