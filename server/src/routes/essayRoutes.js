import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { correctEssay } from '../controllers/essayController.js';

const router = Router();

router.use(authMiddleware);
router.post('/correct', correctEssay);

export default router;
