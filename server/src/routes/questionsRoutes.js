import { Router } from 'express';
import {
  getAll, getById, createQuestion, updateQuestion, deleteQuestion,
  getSubjects, getTopics, getVestibulares, getYears,
  setTargetVestibular, submitAnswer, startPracticeSession, reportQuestion,
} from '../controllers/questionsController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/subjects', getSubjects);
router.get('/topics', getTopics);
router.get('/vestibulares', getVestibulares);
router.get('/years', getYears);
router.get('/', authMiddleware, getAll);
router.get('/:id', authMiddleware, getById);
router.post('/', authMiddleware, createQuestion);
router.put('/:id', authMiddleware, updateQuestion);
router.delete('/:id', authMiddleware, deleteQuestion);
router.post('/session', authMiddleware, startPracticeSession);
router.post('/answer', authMiddleware, submitAnswer);
router.post('/target-vestibular', authMiddleware, setTargetVestibular);
router.post('/:id/report', authMiddleware, reportQuestion);

export default router;
