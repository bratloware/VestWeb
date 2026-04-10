import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Essay, Student } from '../db/models/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads/essays');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIMES = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `essay_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Formato não suportado. Use PDF, JPG, PNG, DOC, DOCX ou TXT.'));
    }
  },
});

export const submitEssay = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
  }
  try {
    const essay = await Essay.create({
      student_id: req.user.id,
      file_path: req.file.filename,
      original_name: req.file.originalname,
      file_type: ALLOWED_MIMES[req.file.mimetype] || 'unknown',
      status: 'pending',
    });
    return res.status(201).json({ essay });
  } catch (err) {
    console.error('Erro ao salvar redação:', err);
    return res.status(500).json({ message: 'Erro ao salvar redação.' });
  }
};

export const getMyEssays = async (req, res) => {
  try {
    const essays = await Essay.findAll({
      where: { student_id: req.user.id },
      order: [['created_at', 'DESC']],
    });
    return res.json({ essays });
  } catch (err) {
    console.error('Erro ao buscar redações:', err);
    return res.status(500).json({ message: 'Erro ao buscar redações.' });
  }
};

export const getEssayFile = async (req, res) => {
  try {
    const essay = await Essay.findByPk(req.params.id);
    if (!essay) return res.status(404).json({ message: 'Redação não encontrada.' });

    if (req.user.role === 'student' && essay.student_id !== req.user.id) {
      return res.status(403).json({ message: 'Sem permissão.' });
    }

    const filePath = path.join(uploadDir, essay.file_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Arquivo não encontrado no servidor.' });
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error('Erro ao servir arquivo:', err);
    return res.status(500).json({ message: 'Erro ao buscar arquivo.' });
  }
};

// ── Teacher ──────────────────────────────────────────────

export const getEssaysForTeacher = async (req, res) => {
  try {
    const essays = await Essay.findAll({
      include: [{
        model: Student,
        as: 'student',
        attributes: ['id', 'name', 'email', 'avatar_url'],
      }],
      order: [['created_at', 'DESC']],
    });
    return res.json({ essays });
  } catch (err) {
    console.error('Erro ao buscar redações:', err);
    return res.status(500).json({ message: 'Erro ao buscar redações.' });
  }
};

export const correctEssay = async (req, res) => {
  const { id } = req.params;
  const { nota_total, competencias, comentario_geral, pontos_positivos, pontos_melhorar } = req.body;

  try {
    const essay = await Essay.findByPk(id);
    if (!essay) return res.status(404).json({ message: 'Redação não encontrada.' });

    const [c1, c2, c3, c4, c5] = competencias;

    await essay.update({
      status: 'corrected',
      nota_total,
      c1_nota: c1.nota, c1_comentario: c1.comentario,
      c2_nota: c2.nota, c2_comentario: c2.comentario,
      c3_nota: c3.nota, c3_comentario: c3.comentario,
      c4_nota: c4.nota, c4_comentario: c4.comentario,
      c5_nota: c5.nota, c5_comentario: c5.comentario,
      comentario_geral,
      pontos_positivos,
      pontos_melhorar,
      corrected_by: req.user.id,
      corrected_at: new Date(),
    });

    return res.json({ essay });
  } catch (err) {
    console.error('Erro ao salvar correção:', err);
    return res.status(500).json({ message: 'Erro ao salvar correção.' });
  }
};
