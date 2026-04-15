import { Router } from 'express';
import {
  getAll, getById,
  getSubjects, getVestibulares, getYears,
  setTargetVestibular, submitAnswer, startPracticeSession,
} from '../controllers/questionsController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/subjects', getSubjects);
router.get('/vestibulares', getVestibulares);
router.get('/years', getYears);
router.get('/', authMiddleware, getAll);
router.get('/:id', authMiddleware, getById);
router.post('/session', authMiddleware, startPracticeSession);
router.post('/answer', authMiddleware, submitAnswer);
router.post('/target-vestibular', authMiddleware, setTargetVestibular);

export default router;
