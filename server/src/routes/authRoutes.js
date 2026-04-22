import { Router } from 'express';
import { login, teacherLogin, me, updateMe, uploadAvatar, changePassword, logout, createTeacher, listTeachers, listStudents, getSiteStats, updateStudent, resetStudentPassword, listSubscriptions, listPending, approvePending, rejectPending, listQuestionReports, resolveQuestionReport, listAdmins, createAdmin, updateAdminProfile, resetAdminPassword } from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { uploadAvatar as uploadMiddleware } from '../middlewares/uploadMiddleware.js';

const router = Router();

router.post('/login', login);
router.post('/teacher-login', teacherLogin);
router.get('/me', authMiddleware, me);
router.put('/me', authMiddleware, updateMe);
router.post('/avatar', authMiddleware, (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, uploadAvatar);
router.put('/change-password', authMiddleware, changePassword);
router.post('/logout', authMiddleware, logout);
router.post('/teachers', authMiddleware, createTeacher);
router.get('/teachers', authMiddleware, listTeachers);
router.get('/students', authMiddleware, listStudents);
router.patch('/students/:id', authMiddleware, updateStudent);
router.post('/students/:id/reset-password', authMiddleware, resetStudentPassword);
router.get('/stats', authMiddleware, getSiteStats);
router.get('/subscriptions', authMiddleware, listSubscriptions);
router.get('/pending', authMiddleware, listPending);
router.post('/pending/:id/approve', authMiddleware, approvePending);
router.delete('/pending/:id', authMiddleware, rejectPending);
router.get('/question-reports', authMiddleware, listQuestionReports);
router.patch('/question-reports/:id', authMiddleware, resolveQuestionReport);
router.get('/admins', authMiddleware, listAdmins);
router.post('/admins', authMiddleware, createAdmin);
router.patch('/admins/:id', authMiddleware, updateAdminProfile);
router.post('/admins/:id/reset-password', authMiddleware, resetAdminPassword);

export default router;
