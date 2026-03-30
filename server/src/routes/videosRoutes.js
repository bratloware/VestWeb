import { Router } from 'express';
import { getAll, getById, create, update, destroy, getMyVideos, updateProgress, toggleFavorite, getFavorites } from '../controllers/videosController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/favorites', getFavorites);
router.get('/my', getMyVideos);
router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id/progress', updateProgress);
router.put('/:id', update);
router.delete('/:id', destroy);
router.post('/:id/favorite', toggleFavorite);

export default router;
