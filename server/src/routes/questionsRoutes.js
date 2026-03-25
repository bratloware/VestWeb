import { Router } from 'express';
import { getAll, getById, create, update, remove, getSubjects, submitAnswer } from '../controllers/questionsController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/subjects', getSubjects);
router.get('/', authMiddleware, getAll);
router.get('/:id', authMiddleware, getById);
router.post('/', authMiddleware, create);
router.put('/:id', authMiddleware, update);
router.delete('/:id', authMiddleware, remove);
router.post('/answer', authMiddleware, submitAnswer);

export default router;
