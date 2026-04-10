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
  getInsights,
  getActivity,
  getMyAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementsFeed,
} from '../controllers/teacherController.js';
import { getEssaysForTeacher, correctEssay, getEssayFile } from '../controllers/essayController.js';

const router = Router();

router.use(authMiddleware);
router.use(requireTeacher);

router.get('/profile', getProfile);
router.get('/insights', getInsights);
router.get('/activity', getActivity);

router.get('/announcements/feed', getAnnouncementsFeed);
router.get('/announcements', getMyAnnouncements);
router.post('/announcements', createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

router.get('/sessions', getMySessions);
router.put('/sessions/:id', updateSession);

router.get('/questions', getMyQuestions);
router.post('/questions', createQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

router.get('/essays', getEssaysForTeacher);
router.get('/essays/file/:id', getEssayFile);
router.put('/essays/:id/correct', correctEssay);

export default router;
