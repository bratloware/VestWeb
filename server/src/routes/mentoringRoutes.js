import { Router } from 'express';
import { getMentors, getSessions, bookSession, updateSessionStatus } from '../controllers/mentoringController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/mentors', getMentors);
router.get('/sessions', getSessions);
router.post('/sessions', bookSession);
router.put('/sessions/:id', updateSessionStatus);

export default router;
