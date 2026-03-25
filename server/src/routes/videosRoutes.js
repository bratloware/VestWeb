import { Router } from 'express';
import { getAll, getById, create, updateProgress, toggleFavorite, getFavorites } from '../controllers/videosController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/favorites', getFavorites);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id/progress', updateProgress);
router.post('/:id/favorite', toggleFavorite);

export default router;
