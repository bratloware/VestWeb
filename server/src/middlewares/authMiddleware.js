import { verifyToken } from '../services/jwtService.js';
import { Student, Teacher } from '../db/models/index.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (decoded.type === 'teacher') {
      const teacher = await Teacher.findByPk(decoded.id);
      if (!teacher) return res.status(401).json({ message: 'User not found' });
      req.user = { ...teacher.toJSON(), type: 'teacher', role: 'teacher' };
    } else {
      const student = await Student.findByPk(decoded.id);
      if (!student) return res.status(401).json({ message: 'User not found' });
      req.user = { ...student.toJSON(), type: 'student' };
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default authMiddleware;
