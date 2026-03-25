import { Router } from 'express';
import { getPosts, createPost, deletePost, likePost, getComments, addComment, reportPost, getRanking } from '../controllers/communityController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/posts', getPosts);
router.post('/posts', createPost);
router.delete('/posts/:id', deletePost);
router.post('/posts/:id/like', likePost);
router.get('/posts/:id/comments', getComments);
router.post('/posts/:id/comments', addComment);
router.post('/posts/:id/report', reportPost);
router.get('/ranking', getRanking);

export default router;
