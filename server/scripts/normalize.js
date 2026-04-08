/**
 * normalize.js
 *
 * Converte datasets externos de vestibulares para o formato padrão VestWeb.
 *
 * Uso:
 *   node scripts/normalize.js <arquivo-entrada.json> <vestibular> [arquivo-saida.json]
 *
 * Exemplos:
 *   node scripts/normalize.js data/raw/enem-raw.json ENEM
 *   node scripts/normalize.js data/raw/fuvest-raw.json FUVEST data/fuvest.json
 *
 * Formato de saída (padrão VestWeb):
 * [
 *   {
 *     "statement":    "Texto da questão",
 *     "year":         2023,
 *     "difficulty":   "medium",
 *     "vestibular":   "ENEM",
 *     "subject":      "Matemática",
 *     "topic":        "Álgebra",       // pode ser null
 *     "subtopic":     null,
 *     "alternatives": [
 *       { "letter": "A", "text": "...", "is_correct": false },
 *       { "letter": "B", "text": "...", "is_correct": true  },
 *       ...
 *     ]
 *   }
 * ]
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// ── Mapeamento de matérias (normaliza variações de nome) ──────────────────────
const SUBJECT_MAP = {
  // Matemática
  'matematica': 'Matemática', 'math': 'Matemática', 'mathematics': 'Matemática',
  'matemática': 'Matemática',

  // Português
  'portugues': 'Língua Portuguesa', 'português': 'Língua Portuguesa',
  'lingua portuguesa': 'Língua Portuguesa', 'língua portuguesa': 'Língua Portuguesa',
  'linguagens': 'Língua Portuguesa',

  // Física
  'fisica': 'Física', 'física': 'Física', 'physics': 'Física',

  // Química
  'quimica': 'Química', 'química': 'Química', 'chemistry': 'Química',

  // Biologia
  'biologia': 'Biologia', 'biology': 'Biologia', 'ciencias biologicas': 'Biologia',
  'ciências biológicas': 'Biologia',

  // História
  'historia': 'História', 'história': 'História', 'history': 'História',

  // Geografia
  'geografia': 'Geografia', 'geography': 'Geografia',

  // Filosofia
  'filosofia': 'Filosofia', 'philosophy': 'Filosofia',

  // Sociologia
  'sociologia': 'Sociologia', 'sociology': 'Sociologia',

  // Ciências Humanas (ENEM agrupado)
  'ciencias humanas': 'Ciências Humanas', 'ciências humanas': 'Ciências Humanas',

  // Ciências da Natureza (ENEM agrupado)
  'ciencias da natureza': 'Ciências da Natureza', 'ciências da natureza': 'Ciências da Natureza',

  // Inglês / Espanhol
  'ingles': 'Inglês', 'inglês': 'Inglês', 'english': 'Inglês',
  'espanhol': 'Espanhol', 'spanish': 'Espanhol',

  // Redação
  'redacao': 'Redação', 'redação': 'Redação', 'writing': 'Redação',
};

function normalizeSubject(raw) {
  if (!raw) return 'Geral';
  const key = raw.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos para lookup
    .replace(/[^a-z\s]/g, '').trim();

  // Tenta com acento removido
  const normalized = SUBJECT_MAP[key];
  if (normalized) return normalized;

  // Tenta com a string original normalizada
  const keyOriginal = raw.toLowerCase().trim();
  if (SUBJECT_MAP[keyOriginal]) return SUBJECT_MAP[keyOriginal];

  // Retorna capitalizado se não encontrar mapeamento
  return raw.trim().replace(/\b\w/g, c => c.toUpperCase());
}

// ── Normaliza letra da alternativa ───────────────────────────────────────────
function letterFromIndex(i) {
  return String.fromCharCode(65 + i); // 0→A, 1→B...
}

function normalizeLetter(raw) {
  if (!raw) return null;
  const s = String(raw).toUpperCase().trim();
  if (['A', 'B', 'C', 'D', 'E'].includes(s)) return s;
  return null;
}

// ── Detecta qual alternativa é correta ───────────────────────────────────────
function detectCorrect(q, alternatives) {
  // correct_index / correctIndex (0-based int)
  if (q.correct_index !== undefined) return q.correct_index;
  if (q.correctIndex !== undefined) return q.correctIndex;
  if (q.resposta_index !== undefined) return q.resposta_index;

  // correct / answer / gabarito como letra ("A", "B"...)
  const letterFields = ['correct', 'answer', 'gabarito', 'resposta', 'correct_answer', 'correctAnswer'];
  for (const field of letterFields) {
    const val = q[field];
    if (val === undefined || val === null) continue;
    const letter = normalizeLetter(val);
    if (letter) return letter.charCodeAt(0) - 65; // A→0, B→1...
    if (typeof val === 'number' && val >= 0 && val <= 4) return val;
  }

  return null;
}

// ── Normaliza array de alternativas ─────────────────────────────────────────
function normalizeAlternatives(q) {
  const correctIndex = detectCorrect(q, null);

  // Formato 1: alternatives: [{letter, text, is_correct}]
  if (Array.isArray(q.alternatives) && q.alternatives.length > 0) {
    const alts = q.alternatives;
    // já tem is_correct
    if (alts[0].is_correct !== undefined) {
      return alts.map((a, i) => ({
        letter: normalizeLetter(a.letter) || letterFromIndex(i),
        text: String(a.text || '').trim(),
        is_correct: Boolean(a.is_correct),
      }));
    }
    // tem letter + text mas sem is_correct
    return alts.map((a, i) => ({
      letter: normalizeLetter(a.letter) || letterFromIndex(i),
      text: String(a.text || a.content || '').trim(),
      is_correct: correctIndex !== null ? i === correctIndex : false,
    }));
  }

  // Formato 2: options como array de objetos {letter, text, is_correct}
  if (Array.isArray(q.options) && q.options.length > 0) {
    if (typeof q.options[0] === 'object') {
      return q.options.map((a, i) => ({
        letter: normalizeLetter(a.letter) || letterFromIndex(i),
        text: String(a.text || a.content || '').trim(),
        is_correct: a.is_correct === true || (correctIndex !== null ? i === correctIndex : false),
      }));
    }
    // options como array de strings simples
    return q.options.map((opt, i) => ({
      letter: letterFromIndex(i),
      text: String(opt).trim(),
      is_correct: correctIndex !== null ? i === correctIndex : false,
    }));
  }

  // Formato 3: alternativas: [{letra, texto}] (português)
  if (Array.isArray(q.alternativas) && q.alternativas.length > 0) {
    return q.alternativas.map((a, i) => ({
      letter: normalizeLetter(a.letra) || letterFromIndex(i),
      text: String(a.texto || a.text || '').trim(),
      is_correct: correctIndex !== null ? i === correctIndex : false,
    }));
  }

  // Formato 4: a, b, c, d, e como campos diretos
  const letters = ['a', 'b', 'c', 'd', 'e'];
  if (q.a !== undefined && q.b !== undefined) {
    return letters
      .filter(l => q[l] !== undefined)
      .map((l, i) => ({
        letter: l.toUpperCase(),
        text: String(q[l]).trim(),
        is_correct: correctIndex !== null ? i === correctIndex : false,
      }));
  }

  return [];
}

// ── Extrai o enunciado ───────────────────────────────────────────────────────
function extractStatement(q) {
  return (
    q.statement || q.enunciado || q.question || q.texto ||
    q.pergunta || q.content || q.body || ''
  ).trim();
}

// ── Extrai o ano ─────────────────────────────────────────────────────────────
function extractYear(q) {
  const raw = q.year || q.ano || q.year_exam || q.yearExam || null;
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return n >= 1900 && n <= 2100 ? n : null;
}

// ── Extrai dificuldade ───────────────────────────────────────────────────────
function extractDifficulty(q) {
  const raw = (q.difficulty || q.dificuldade || '').toLowerCase();
  if (['easy', 'facil', 'fácil'].includes(raw)) return 'easy';
  if (['hard', 'dificil', 'difícil'].includes(raw)) return 'hard';
  return 'medium';
}

// ── Normaliza uma questão ────────────────────────────────────────────────────
function normalizeQuestion(q, vestibular) {
  const statement = extractStatement(q);
  if (!statement) return null;

  const alternatives = normalizeAlternatives(q);
  if (alternatives.length < 2) return null;

  const correctCount = alternatives.filter(a => a.is_correct).length;
  if (correctCount !== 1) {
    // Tenta corrigir com campo do dataset
    const idx = detectCorrect(q, alternatives);
    if (idx !== null && idx < alternatives.length) {
      alternatives.forEach((a, i) => { a.is_correct = i === idx; });
    } else if (allowNoAnswer) {
      // Dataset sem gabarito: marca a primeira como correta provisoriamente
      alternatives.forEach((a, i) => { a.is_correct = i === 0; });
    } else {
      return null; // sem gabarito confiável
    }
  }

  const subject = normalizeSubject(
    q.subject || q.materia || q.disciplina || q.area ||
    q.subject_name || q.subjectName || null
  );

  const topic = (q.topic || q.assunto || q.topico || q.tópico || null);

  return {
    statement,
    year: extractYear(q),
    difficulty: extractDifficulty(q),
    vestibular: vestibular.toUpperCase(),
    subject,
    topic: topic ? String(topic).trim() : null,
    subtopic: q.subtopic || q.subtopico || null,
    alternatives,
  };
}

// ── Valida questão normalizada ───────────────────────────────────────────────
function validate(q, index) {
  const errors = [];
  if (!q.statement) errors.push('statement vazio');
  if (!q.alternatives || q.alternatives.length < 2) errors.push('menos de 2 alternativas');
  if (q.alternatives?.filter(a => a.is_correct).length !== 1) errors.push('não tem exatamente 1 alternativa correta');
  if (q.alternatives?.some(a => !a.text)) errors.push('alternativa sem texto');
  return errors;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const allowNoAnswer = flags.includes('--allow-no-answer');

const [inputArg, vestibularArg, outputArg] = args;

if (!inputArg || !vestibularArg) {
  console.error('Uso: node scripts/normalize.js <input.json> <VESTIBULAR> [output.json]');
  process.exit(1);
}

const inputPath = resolve(inputArg);
const vestibular = vestibularArg.toUpperCase();
const outputPath = outputArg
  ? resolve(outputArg)
  : resolve(`data/${vestibular.toLowerCase()}.json`);

let raw;
try {
  raw = JSON.parse(readFileSync(inputPath, 'utf8'));
} catch (err) {
  console.error(`Erro ao ler ${inputPath}: ${err.message}`);
  process.exit(1);
}

if (!Array.isArray(raw)) {
  // alguns datasets têm wrapper: { questions: [...] } ou { data: [...] }
  raw = raw.questions || raw.data || raw.questoes || Object.values(raw);
}

console.log(`\nNormalizando ${raw.length} questões de ${vestibular}...\n`);

const normalized = [];
const skipped = [];

for (let i = 0; i < raw.length; i++) {
  const result = normalizeQuestion(raw[i], vestibular);
  if (!result) { skipped.push(i + 1); continue; }

  const errors = validate(result, i);
  if (errors.length > 0) {
    skipped.push({ index: i + 1, errors });
  } else {
    normalized.push(result);
  }
}

writeFileSync(outputPath, JSON.stringify(normalized, null, 2), 'utf8');

console.log(`✅  Normalizadas: ${normalized.length}`);
console.log(`⚠️   Ignoradas:    ${skipped.length}`);
console.log(`📄  Saída:         ${outputPath}\n`);
