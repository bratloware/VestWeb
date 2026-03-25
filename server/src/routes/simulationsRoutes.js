import { Router } from 'express';
import { getAll, getById, create, startSession, finishSession, getHistory } from '../controllers/simulationsController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAll);
router.get('/history', getHistory);
router.get('/:id', getById);
router.post('/', create);
router.post('/:id/start', startSession);
router.post('/sessions/:sessionId/finish', finishSession);

export default router;
