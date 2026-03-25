import { Router } from 'express';
import { getMyPoints, getMyBadges, getMyStreak, getLeaderboard } from '../controllers/gamificationController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/points', getMyPoints);
router.get('/badges', getMyBadges);
router.get('/streak', getMyStreak);
router.get('/leaderboard', getLeaderboard);

export default router;
