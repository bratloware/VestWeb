import { Router } from 'express';
import { getMyPoints, getMyBadges, getMyStreak, getLeaderboard, getMyStats, getSubjectStats, getRecentSessions } from '../controllers/gamificationController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/points', getMyPoints);
router.get('/badges', getMyBadges);
router.get('/streak', getMyStreak);
router.get('/leaderboard', getLeaderboard);
router.get('/stats', getMyStats);
router.get('/subject-stats', getSubjectStats);
router.get('/recent-sessions', getRecentSessions);

export default router;
