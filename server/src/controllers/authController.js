import { Student, Session } from '../db/models/index.js';
import { generateToken } from '../services/jwtService.js';
import { comparePassword } from '../services/hashService.js';

export const login = async (req, res) => {
  try {
    const { enrollment, password } = req.body;
    if (!enrollment || !password) {
      return res.status(400).json({ message: 'Enrollment and password are required' });
    }

    const student = await Student.findOne({ where: { enrollment } });
    if (!student) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, student.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: student.id, role: student.role });

    // Store session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await Session.create({ student_id: student.id, token, expires_at: expiresAt });

    return res.json({
      message: 'Login successful',
      data: {
        token,
        student: student.toJSON(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
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
      await Session.destroy({ where: { token } });
    }
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
