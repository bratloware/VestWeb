import { Router } from 'express';
import { getBanners, getTestimonials, getInstitutionalVideo, getCollaborators, submitContact } from '../controllers/landingController.js';

const router = Router();

router.get('/banners', getBanners);
router.get('/testimonials', getTestimonials);
router.get('/video', getInstitutionalVideo);
router.get('/collaborators', getCollaborators);
router.post('/contact', submitContact);

export default router;
