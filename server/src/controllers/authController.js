import { Op } from 'sequelize';
import { Student, Session, Teacher, TeacherSession, Mentor, Video, Question, Subscription, PendingStudent, QuestionReport } from '../db/models/index.js';
import { generateToken } from '../services/jwtService.js';
import { comparePassword, hashPassword } from '../services/hashService.js';

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

    // 1. Try Teacher table first
    const teacher = await Teacher.findOne({ where: { enrollment } });
    if (teacher) {
      const isMatch = await comparePassword(password, teacher.password_hash);
      if (!isMatch) return res.status(401).json({ message: 'Matrícula ou senha inválidos' });

      const token = generateToken({ id: teacher.id, type: 'teacher' });
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await TeacherSession.create({ teacher_id: teacher.id, token, expires_at: expiresAt });

      return res.json({
        message: 'Login successful',
        data: { token, user: { ...teacher.toJSON(), type: 'teacher', role: 'teacher' } },
      });
    }

    // 2. Fallback: admin accounts stored in students table
    const admin = await Student.findOne({ where: { enrollment, role: 'admin' } });
    if (!admin) return res.status(401).json({ message: 'Matrícula ou senha inválidos' });

    const isMatch = await comparePassword(password, admin.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Matrícula ou senha inválidos' });

    const token = generateToken({ id: admin.id, type: 'student' });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await Session.create({ student_id: admin.id, token, expires_at: expiresAt });

    return res.json({
      message: 'Login successful',
      data: { token, user: { ...admin.toJSON(), type: 'student' } },
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

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado' });

    const Model = req.user.type === 'teacher' ? Teacher : Student;
    const record = await Model.findByPk(req.user.id);
    if (!record) return res.status(404).json({ message: 'User not found' });

    const base64 = req.file.buffer.toString('base64');
    const avatar_url = `data:${req.file.mimetype};base64,${base64}`;
    await record.update({ avatar_url });
    return res.json({ message: 'Avatar updated', data: { avatar_url } });
  } catch (error) {
    console.error('uploadAvatar error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { name, email, avatar_url } = req.body;
    const Model = req.user.type === 'teacher' ? Teacher : Student;
    const record = await Model.findByPk(req.user.id);
    if (!record) return res.status(404).json({ message: 'User not found' });

    await record.update({ name, email, avatar_url });
    return res.json({ message: 'Profile updated', data: record });
  } catch (error) {
    console.error('updateMe error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ message: 'current_password e new_password são obrigatórios' });
    }
    const Model = req.user.type === 'teacher' ? Teacher : Student;
    const record = await Model.findByPk(req.user.id);
    if (!record) return res.status(404).json({ message: 'User not found' });

    const isMatch = await comparePassword(current_password, record.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Senha atual incorreta' });

    const password_hash = await hashPassword(new_password);
    await record.update({ password_hash });
    return res.json({ message: 'Password updated' });
  } catch (error) {
    console.error('changePassword error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createTeacher = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso restrito a administradores' });
    }

    const { name, email, enrollment, password, bio, specialty } = req.body;
    if (!name || !email || !enrollment || !password) {
      return res.status(400).json({ message: 'name, email, enrollment e password são obrigatórios' });
    }

    const existing = await Teacher.findOne({ where: { enrollment } });
    if (existing) {
      return res.status(409).json({ message: 'Matrícula já cadastrada' });
    }

    const emailTaken = await Teacher.findOne({ where: { email } });
    if (emailTaken) {
      return res.status(409).json({ message: 'E-mail já cadastrado' });
    }

    const password_hash = await hashPassword(password);
    const teacher = await Teacher.create({ name, email, enrollment, password_hash, bio: bio ?? null });

    const mentor = await Mentor.create({
      teacher_id: teacher.id,
      bio: bio ?? null,
      specialties: specialty ?? null,
    });

    return res.status(201).json({
      message: 'Professor criado com sucesso',
      data: { teacher: { ...teacher.toJSON(), password_hash: undefined }, mentor },
    });
  } catch (error) {
    console.error('createTeacher error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const listTeachers = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso restrito a administradores' });
    }
    const teachers = await Teacher.findAll({
      attributes: ['id', 'name', 'email', 'enrollment', 'bio', 'avatar_url', 'created_at'],
      order: [['name', 'ASC']],
    });
    return res.json({ message: 'Teachers fetched', data: teachers });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const listStudents = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso restrito a administradores' });
    }
    const students = await Student.findAll({
      attributes: ['id', 'name', 'email', 'enrollment', 'role', 'avatar_url', 'created_at'],
      order: [['created_at', 'DESC']],
    });
    return res.json({ message: 'Students fetched', data: students });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getSiteStats = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso restrito a administradores' });
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalStudents,
      totalTeachers,
      totalVideos,
      publishedVideos,
      totalQuestions,
      weeklyStudentLogins,
      weeklyTeacherLogins,
      newStudentsThisWeek,
    ] = await Promise.all([
      Student.count({ where: { role: 'student' } }),
      Teacher.count(),
      Video.count(),
      Video.count({ where: { published_at: { [Op.not]: null, [Op.lte]: new Date() } } }),
      Question.count(),
      Session.count({ where: { created_at: { [Op.gte]: weekAgo } } }),
      TeacherSession.count({ where: { created_at: { [Op.gte]: weekAgo } } }),
      Student.count({ where: { created_at: { [Op.gte]: weekAgo }, role: 'student' } }),
    ]);

    return res.json({
      message: 'Stats fetched',
      data: {
        totalStudents,
        totalTeachers,
        totalVideos,
        publishedVideos,
        totalQuestions,
        weeklyLogins: weeklyStudentLogins + weeklyTeacherLogins,
        newStudentsThisWeek,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ── Admin: Admin account management ───────────────────────────────────────────

export const listAdmins = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Acesso restrito a administradores' });

    const admins = await Student.findAll({
      where: { role: 'admin' },
      attributes: ['id', 'name', 'email', 'enrollment', 'active', 'avatar_url', 'created_at'],
      order: [['created_at', 'ASC']],
    });
    return res.json({ message: 'Admins fetched', data: admins });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const createAdmin = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Acesso restrito a administradores' });

    const { name, email, enrollment, password } = req.body;
    if (!name || !email || !enrollment || !password) {
      return res.status(400).json({ message: 'name, email, enrollment e password são obrigatórios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'A senha deve ter ao menos 6 caracteres' });
    }

    const [emailTaken, enrollmentTaken] = await Promise.all([
      Student.findOne({ where: { email } }),
      Student.findOne({ where: { enrollment } }),
    ]);
    if (emailTaken) return res.status(409).json({ message: 'E-mail já cadastrado' });
    if (enrollmentTaken) return res.status(409).json({ message: 'Matrícula já cadastrada' });

    const password_hash = await hashPassword(password);
    const admin = await Student.create({ name, email, enrollment, password_hash, role: 'admin', active: true });

    const { password_hash: _ph, ...safe } = admin.toJSON();
    return res.status(201).json({ message: 'Administrador criado com sucesso', data: safe });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Acesso restrito a administradores' });

    const target = await Student.findByPk(req.params.id);
    if (!target || target.role !== 'admin') return res.status(404).json({ message: 'Administrador não encontrado' });

    const { name, email, enrollment, active, new_password } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) {
      const taken = await Student.findOne({ where: { email } });
      if (taken && taken.id !== target.id) return res.status(409).json({ message: 'E-mail já em uso' });
      updates.email = email;
    }
    if (enrollment) {
      const taken = await Student.findOne({ where: { enrollment } });
      if (taken && taken.id !== target.id) return res.status(409).json({ message: 'Matrícula já em uso' });
      updates.enrollment = enrollment;
    }
    if (active !== undefined) updates.active = active;
    if (new_password) {
      if (new_password.length < 6) return res.status(400).json({ message: 'Senha deve ter ao menos 6 caracteres' });
      updates.password_hash = await hashPassword(new_password);
    }

    await target.update(updates);
    await Session.destroy({ where: { student_id: target.id } });

    const { password_hash: _ph, ...safe } = target.toJSON();
    return res.json({ message: 'Administrador atualizado', data: safe });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const resetAdminPassword = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Acesso restrito a administradores' });

    const target = await Student.findByPk(req.params.id);
    if (!target || target.role !== 'admin') return res.status(404).json({ message: 'Administrador não encontrado' });

    const temp = Math.random().toString(36).slice(2, 10);
    const password_hash = await hashPassword(temp);
    await target.update({ password_hash });
    await Session.destroy({ where: { student_id: target.id } });

    return res.json({ message: 'Senha redefinida', data: { temp_password: temp } });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ── Admin: Student management ──────────────────────────────────────────────────

export const updateStudent = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Acesso restrito a administradores' });

    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: 'Aluno não encontrado' });

    const { role, active, new_password } = req.body;
    const updates = {};

    if (role !== undefined) updates.role = role;
    if (active !== undefined) updates.active = active;
    if (new_password) updates.password_hash = await hashPassword(new_password);

    await student.update(updates);
    return res.json({ message: 'Aluno atualizado', data: student });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const resetStudentPassword = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Acesso restrito a administradores' });

    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ message: 'Aluno não encontrado' });

    const temp = Math.random().toString(36).slice(2, 10);
    const password_hash = await hashPassword(temp);
    await student.update({ password_hash });

    // Invalidate all existing sessions
    await Session.destroy({ where: { student_id: student.id } });

    return res.json({ message: 'Senha redefinida', data: { temp_password: temp } });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ── Admin: Subscriptions ───────────────────────────────────────────────────────

export const listSubscriptions = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Acesso restrito a administradores' });

    const subscriptions = await Subscription.findAll({ order: [['created_at', 'DESC']] });
    return res.json({ message: 'Subscriptions fetched', data: subscriptions });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ── Admin: Pending students ────────────────────────────────────────────────────

export const listPending = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Acesso restrito a administradores' });

    const pending = await PendingStudent.findAll({
      attributes: ['id', 'name', 'email', 'created_at', 'stripe_session_id', 'target_vestibular_id'],
      order: [['created_at', 'DESC']],
    });
    return res.json({ message: 'Pending fetched', data: pending });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const approvePending = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Acesso restrito a administradores' });

    const pending = await PendingStudent.findByPk(req.params.id);
    if (!pending) return res.status(404).json({ message: 'Aluno pendente não encontrado' });

    const alreadyExists = await Student.findOne({ where: { email: pending.email } });
    if (alreadyExists) {
      await pending.destroy();
      return res.status(409).json({ message: 'Aluno já cadastrado com este e-mail' });
    }

    let enrollment;
    let taken = true;
    while (taken) {
      enrollment = Math.floor(10000000 + Math.random() * 90000000).toString();
      taken = !!(await Student.findOne({ where: { enrollment } }));
    }

    const student = await Student.create({
      name: pending.name,
      email: pending.email,
      password_hash: pending.password_hash,
      enrollment,
      target_vestibular_id: pending.target_vestibular_id ?? null,
      role: 'student',
    });

    await pending.destroy();
    return res.status(201).json({ message: 'Aluno aprovado', data: student });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const rejectPending = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Acesso restrito a administradores' });

    const pending = await PendingStudent.findByPk(req.params.id);
    if (!pending) return res.status(404).json({ message: 'Aluno pendente não encontrado' });

    await pending.destroy();
    return res.json({ message: 'Aluno rejeitado e removido da fila' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ── Admin: Question reports ────────────────────────────────────────────────────

export const listQuestionReports = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Acesso restrito a administradores' });

    const reports = await QuestionReport.findAll({
      include: [
        { model: Student, as: 'student', attributes: ['id', 'name', 'email', 'enrollment'] },
        { model: Question, as: 'question', attributes: ['id', 'statement'] },
      ],
      order: [['created_at', 'DESC']],
    });
    return res.json({ message: 'Reports fetched', data: reports });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const resolveQuestionReport = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Acesso restrito a administradores' });

    const report = await QuestionReport.findByPk(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report não encontrado' });

    const { status } = req.body;
    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    await report.update({ status });
    return res.json({ message: 'Report atualizado', data: report });
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
