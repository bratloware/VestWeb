import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import requireTeacher from '../middlewares/requireTeacher.js';
import {
  getProfile,
  getMySessions,
  updateSession,
  getMyQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from '../controllers/teacherController.js';

const router = Router();

router.use(authMiddleware);
router.use(requireTeacher);

router.get('/profile', getProfile);

router.get('/sessions', getMySessions);
router.put('/sessions/:id', updateSession);

router.get('/questions', getMyQuestions);
router.post('/questions', createQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

export default router;
