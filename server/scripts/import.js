/**
 * import.js
 *
 * Importa questões normalizadas (formato padrão VestWeb) para o banco.
 * Cria automaticamente Subject, Topic, Subtopic e Vestibular se não existirem.
 *
 * Uso:
 *   node scripts/import.js <arquivo.json>
 *   node scripts/import.js data/enem.json
 *   node scripts/import.js data/fuvest.json
 *
 * Formato de entrada esperado (saída do normalize.js):
 * [
 *   {
 *     "statement":    "Texto da questão",
 *     "year":         2023,
 *     "difficulty":   "medium",
 *     "vestibular":   "ENEM",
 *     "subject":      "Matemática",
 *     "topic":        "Álgebra",
 *     "subtopic":     null,
 *     "alternatives": [
 *       { "letter": "A", "text": "...", "is_correct": false },
 *       { "letter": "B", "text": "...", "is_correct": true  }
 *     ]
 *   }
 * ]
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import sequelize from '../src/db/index.js';
import {
  Subject, Topic, Subtopic, Vestibular,
  Question, Alternative, QuestionVestibular,
} from '../src/db/models/index.js';

const BATCH_SIZE = 200;
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

// ── Cache em memória para evitar findOrCreate repetido ───────────────────────
const cache = {
  subjects:    new Map(), // name → Subject instance
  topics:      new Map(), // `${subject_id}::${name}` → Topic instance
  subtopics:   new Map(), // `${topic_id}::${name}` → Subtopic instance
  vestibulares: new Map(), // name → Vestibular instance
};

async function getOrCreateSubject(name) {
  if (cache.subjects.has(name)) return cache.subjects.get(name);
  const [instance] = await Subject.findOrCreate({ where: { name } });
  cache.subjects.set(name, instance);
  return instance;
}

async function getOrCreateTopic(subjectId, name) {
  const key = `${subjectId}::${name}`;
  if (cache.topics.has(key)) return cache.topics.get(key);
  const [instance] = await Topic.findOrCreate({ where: { subject_id: subjectId, name } });
  cache.topics.set(key, instance);
  return instance;
}

async function getOrCreateSubtopic(topicId, name) {
  const key = `${topicId}::${name}`;
  if (cache.subtopics.has(key)) return cache.subtopics.get(key);
  const [instance] = await Subtopic.findOrCreate({ where: { topic_id: topicId, name } });
  cache.subtopics.set(key, instance);
  return instance;
}

async function getOrCreateVestibular(name) {
  if (cache.vestibulares.has(name)) return cache.vestibulares.get(name);
  const [instance] = await Vestibular.findOrCreate({ where: { name } });
  cache.vestibulares.set(name, instance);
  return instance;
}

// ── Pré-carrega cache do banco (evita N queries desnecessárias) ──────────────
async function warmCache() {
  const [subjects, topics, subtopics, vestibulares] = await Promise.all([
    Subject.findAll(),
    Topic.findAll(),
    Subtopic.findAll(),
    Vestibular.findAll(),
  ]);

  for (const s of subjects) cache.subjects.set(s.name, s);
  for (const t of topics)   cache.topics.set(`${t.subject_id}::${t.name}`, t);
  for (const st of subtopics) cache.subtopics.set(`${st.topic_id}::${st.name}`, st);
  for (const v of vestibulares) cache.vestibulares.set(v.name, v);

  console.log(`  cache: ${subjects.length} matérias, ${topics.length} tópicos, ${vestibulares.length} vestibulares`);
}

// ── Resolve IDs de subject/topic/subtopic/vestibular para uma questão ────────
async function resolveIds(q) {
  const subjectName = q.subject || 'Geral';
  const subject = await getOrCreateSubject(subjectName);

  const topicName = q.topic || subjectName;
  const topic = await getOrCreateTopic(subject.id, topicName);

  let subtopicId = null;
  if (q.subtopic) {
    const subtopic = await getOrCreateSubtopic(topic.id, q.subtopic);
    subtopicId = subtopic.id;
  }

  const vestibularName = q.vestibular || 'Geral';
  const vestibular = await getOrCreateVestibular(vestibularName);

  return { topicId: topic.id, subtopicId, vestibularId: vestibular.id };
}

// ── Valida questão normalizada ───────────────────────────────────────────────
function validate(q, index) {
  const errors = [];
  if (!q.statement?.trim()) errors.push('statement vazio');
  if (!VALID_DIFFICULTIES.includes(q.difficulty)) errors.push(`difficulty inválido: "${q.difficulty}"`);
  if (!Array.isArray(q.alternatives) || q.alternatives.length < 2)
    errors.push('alternatives deve ter pelo menos 2 itens');
  else {
    if (q.alternatives.some(a => !a.text?.trim())) errors.push('alternativa sem texto');
  }
  return errors;
}

// ── Verifica duplicatas pelo hash do statement ───────────────────────────────
async function buildExistingStatements() {
  const existing = await Question.findAll({ attributes: ['statement'] });
  return new Set(existing.map(q => q.statement.trim().toLowerCase()));
}

// ── Main ─────────────────────────────────────────────────────────────────────
const inputArg = process.argv[2];
if (!inputArg) {
  console.error('Uso: node scripts/import.js <arquivo.json>');
  process.exit(1);
}

const inputPath = resolve(inputArg);

let raw;
try {
  raw = JSON.parse(readFileSync(inputPath, 'utf8'));
} catch (err) {
  console.error(`Erro ao ler ${inputPath}: ${err.message}`);
  process.exit(1);
}

if (!Array.isArray(raw) || raw.length === 0) {
  console.error('O arquivo deve conter um array de questões não vazio.');
  process.exit(1);
}

async function main() {
  console.log(`\nImportador VestWeb`);
  console.log(`Arquivo: ${inputPath}`);
  console.log(`Questões no arquivo: ${raw.length}\n`);

  await sequelize.authenticate();
  console.log('Banco conectado.\n');

  console.log('Pré-carregando cache...');
  await warmCache();

  console.log('\nVerificando duplicatas...');
  const existingStatements = await buildExistingStatements();
  console.log(`  ${existingStatements.size} questões já existem no banco\n`);

  // ── Validar e preparar questões ──────────────────────────────────────────
  const valid   = [];
  const skipped = [];

  for (let i = 0; i < raw.length; i++) {
    const q = raw[i];

    const isDuplicate = existingStatements.has(q.statement?.trim().toLowerCase());
    if (isDuplicate) { skipped.push({ index: i + 1, reason: 'duplicata' }); continue; }

    const errors = validate(q, i);
    if (errors.length > 0) {
      skipped.push({ index: i + 1, reason: errors.join(', ') });
    } else {
      valid.push(q);
    }
  }

  console.log(`Válidas:   ${valid.length}`);
  console.log(`Ignoradas: ${skipped.length}`);

  const duplicates = skipped.filter(s => s.reason === 'duplicata').length;
  const invalid    = skipped.length - duplicates;
  if (duplicates > 0) console.log(`  → ${duplicates} duplicatas`);
  if (invalid > 0)    console.log(`  → ${invalid} inválidas`);

  if (valid.length === 0) {
    console.log('\nNenhuma questão nova para importar.');
    await sequelize.close();
    return;
  }

  // ── Resolver IDs (subject/topic/vestibular) ──────────────────────────────
  console.log('\nResolvendo matérias, tópicos e vestibulares...');
  const resolved = [];

  for (const q of valid) {
    const ids = await resolveIds(q);
    resolved.push({ q, ids });
  }
  console.log('  Concluído.');

  // ── Inserir em lotes ─────────────────────────────────────────────────────
  let inserted = 0;
  let failed   = 0;
  const totalBatches = Math.ceil(resolved.length / BATCH_SIZE);

  console.log(`\nImportando em lotes de ${BATCH_SIZE}...\n`);

  for (let i = 0; i < resolved.length; i += BATCH_SIZE) {
    const batch = resolved.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    process.stdout.write(`  Lote ${batchNum}/${totalBatches} (${batch.length} questões)... `);

    const t = await sequelize.transaction();
    try {
      // 1. bulk create questions
      const created = await Question.bulkCreate(
        batch.map(({ q, ids }) => ({
          statement:   q.statement.trim(),
          topic_id:    ids.topicId,
          subtopic_id: ids.subtopicId,
          difficulty:  q.difficulty,
          year:        q.year || null,
          number:      q.number ?? null,
          image:       q.image ?? null,
          bank:        q.vestibular || null,
          created_by:  null,
        })),
        { transaction: t, returning: true }
      );

      // 2. bulk create alternatives
      const alternatives = [];
      for (let j = 0; j < created.length; j++) {
        for (const alt of batch[j].q.alternatives) {
          alternatives.push({
            question_id: created[j].id,
            letter:      alt.letter,
            text:        alt.text.trim(),
            is_correct:  alt.is_correct,
          });
        }
      }
      await Alternative.bulkCreate(alternatives, { transaction: t });

      // 3. bulk create question_vestibulares (link N:N)
      const qv = created.map((q, j) => ({
        question_id:   q.id,
        vestibular_id: batch[j].ids.vestibularId,
      }));
      await QuestionVestibular.bulkCreate(qv, { transaction: t, ignoreDuplicates: true });

      await t.commit();
      inserted += created.length;
      console.log('✅');
    } catch (err) {
      await t.rollback();
      failed += batch.length;
      console.log(`❌  ${err.message}`);
    }
  }

  // ── Resumo ───────────────────────────────────────────────────────────────
  console.log('\n────────────────────────────────────────');
  console.log(`✅  Importadas:  ${inserted}`);
  if (failed > 0)           console.log(`❌  Falhas:      ${failed}`);
  if (duplicates > 0)       console.log(`♻️   Duplicatas:  ${duplicates}`);
  if (invalid > 0)          console.log(`⚠️   Inválidas:   ${invalid}`);
  console.log(`📦  Total arq.:  ${raw.length}`);
  console.log('────────────────────────────────────────\n');

  await sequelize.close();
}

main().catch(err => {
  console.error('\nErro fatal:', err.message);
  process.exit(1);
});
