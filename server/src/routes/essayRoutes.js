import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { upload, submitEssay, getMyEssays, getEssayFile } from '../controllers/essayController.js';

const router = Router();

router.use(authMiddleware);

router.post('/submit', upload.single('file'), submitEssay);
router.get('/my', getMyEssays);
router.get('/file/:id', getEssayFile);

export default router;
