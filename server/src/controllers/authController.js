import { Student, Session, Teacher, TeacherSession } from '../db/models/index.js';
import { generateToken } from '../services/jwtService.js';
import { comparePassword } from '../services/hashService.js';

export const login = async (req, res) => {
  try {
    const { enrollment, password } = req.body;
    if (!enrollment || !password) {
      return res.status(400).json({ message: 'Matrícula e senha são obrigatórios' });
    }

    const student = await Student.findOne({ where: { enrollment } });
    if (!student) {
      return res.status(401).json({ message: 'Matrícula ou senha inválidos' });
    }

    const isMatch = await comparePassword(password, student.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Matrícula ou senha inválidos' });
    }

    const token = generateToken({ id: student.id, type: 'student' });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await Session.create({ student_id: student.id, token, expires_at: expiresAt });

    return res.json({
      message: 'Login successful',
      data: { token, user: { ...student.toJSON(), type: 'student' } },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const teacherLogin = async (req, res) => {
  try {
    const { enrollment, password } = req.body;
    if (!enrollment || !password) {
      return res.status(400).json({ message: 'Matrícula e senha são obrigatórios' });
    }

    const teacher = await Teacher.findOne({ where: { enrollment } });
    if (!teacher) {
      return res.status(401).json({ message: 'Matrícula ou senha inválidos' });
    }

    const isMatch = await comparePassword(password, teacher.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Matrícula ou senha inválidos' });
    }

    const token = generateToken({ id: teacher.id, type: 'teacher' });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await TeacherSession.create({ teacher_id: teacher.id, token, expires_at: expiresAt });

    return res.json({
      message: 'Login successful',
      data: { token, user: { ...teacher.toJSON(), type: 'teacher', role: 'teacher' } },
    });
  } catch (error) {
    console.error('Teacher login error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const me = async (req, res) => {
  try {
    return res.json({ message: 'User data', data: req.user });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (req.user?.type === 'teacher') {
        await TeacherSession.destroy({ where: { token } });
      } else {
        await Session.destroy({ where: { token } });
      }
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
