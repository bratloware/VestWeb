import { Router } from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent, toggleDone } from '../controllers/calendarController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/events', getEvents);
router.post('/events', createEvent);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);
router.patch('/events/:id/toggle', toggleDone);

export default router;
