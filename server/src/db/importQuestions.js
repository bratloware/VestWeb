/**
 * importQuestions.js
 *
 * Importa questões em massa a partir de um arquivo JSON.
 *
 * Uso:
 *   node src/db/importQuestions.js                        (usa data/questions-sample.json)
 *   node src/db/importQuestions.js data/minhas-questoes.json
 *
 * Formatos aceitos:
 *
 * Formato A (legado) — usa nome do tópico:
 * { "statement": "...", "topic": "Eletroquímica", "difficulty": "medium", "alternatives": [...] }
 *
 * Formato B (novo) — usa subject.name + topic_id:
 * { "statement": "...", "subject": { "id": 2, "name": "Química" }, "topic_id": 1,
 *   "difficulty": "medium", "source": "ENEM", "year": 2010, "bank": "ENEM",
 *   "image_url": "...", "number": 63, "reference": "...", "alternatives": [...] }
 *
 * No formato B, o script verifica se o topic_id pertence ao subject correto.
 * Se não pertencer, usa o tópico genérico daquele subject (ex: "Química").
 */

import 'dotenv/config';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { QueryTypes } from 'sequelize';
import sequelize from './index.js';
import { Topic, Question, Alternative } from './models/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Arquivo de entrada ────────────────────────────────────────────────────────
const inputFile = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(__dirname, '../../data/questions-sample.json');

// ── Helpers ───────────────────────────────────────────────────────────────────
const BATCH_SIZE = 100;
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];

function validate(q) {
  const errors = [];
  if (!q.statement?.trim()) errors.push('statement vazio');

  const hasLegacyTopic  = !!q.topic?.trim();
  const hasNewSubject   = !!q.subject?.name?.trim();
  if (!hasLegacyTopic && !hasNewSubject) errors.push('informe "topic" (nome) ou "subject.name"');

  if (!VALID_DIFFICULTIES.includes(q.difficulty)) errors.push(`difficulty inválido: "${q.difficulty}"`);
  if (!Array.isArray(q.alternatives) || q.alternatives.length !== 5)
    errors.push('alternatives deve ter exatamente 5 itens');
  else {
    const correct = q.alternatives.filter(a => a.is_correct === true);
    if (correct.length !== 1) errors.push('deve haver exatamente 1 alternativa correta');
  }
  return errors;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n📥  Importador de Questões — VestWebWeb');
  console.log(`📂  Arquivo: ${inputFile}\n`);

  // 1. Conectar
  await sequelize.authenticate();
  console.log('✅  Banco conectado');

  // 2. Carregar JSON
  let raw;
  try {
    raw = JSON.parse(readFileSync(inputFile, 'utf8'));
  } catch (err) {
    console.error(`❌  Erro ao ler arquivo: ${err.message}`);
    process.exit(1);
  }
  if (!Array.isArray(raw) || raw.length === 0) {
    console.error('❌  O arquivo deve conter um array de questões não vazio.');
    process.exit(1);
  }
  console.log(`📊  ${raw.length} questões encontradas no arquivo`);

  // 3. Carregar mapa de tópicos  name → id
  const topics = await Topic.findAll({ attributes: ['id', 'name'] });
  const topicMap = {};
  for (const t of topics) topicMap[t.name.toLowerCase().trim()] = t.id;
  console.log(`🗂️   ${topics.length} tópicos carregados do banco\n`);

  // 4. Validar e separar questões
  const valid = [];
  const skipped = [];

  for (let i = 0; i < raw.length; i++) {
    const q = raw[i];
    const errors = validate(q, i);

    const topicKey = q.topic?.toLowerCase().trim();
    const topicId = topicMap[topicKey];
    if (!topicId) errors.push(`tópico não encontrado no banco: "${q.topic}"`);

    if (errors.length > 0) {
      skipped.push({ index: i + 1, statement: q.statement?.slice(0, 60), errors });
    } else {
      valid.push({ ...q, topic_id: topicId });
    }
  }

  console.log(`✅  Válidas: ${valid.length}`);
  console.log(`⚠️   Ignoradas: ${skipped.length}`);

  if (skipped.length > 0) {
    console.log('\n── Questões ignoradas ──');
    for (const s of skipped) {
      console.log(`  [${s.index}] "${s.statement}..." → ${s.errors.join(', ')}`);
    }
    console.log('');
  }

  if (valid.length === 0) {
    console.error('❌  Nenhuma questão válida para importar.');
    process.exit(1);
  }

  // 5. Inserir em lotes
  let inserted = 0;
  let failed = 0;

  console.log(`\n🚀  Iniciando importação em lotes de ${BATCH_SIZE}...\n`);

  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batch = valid.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(valid.length / BATCH_SIZE);

    process.stdout.write(`   Lote ${batchNum}/${totalBatches} (${batch.length} questões)... `);

    const t = await sequelize.transaction();
    try {
      // Inserir questões do lote
      const created = await Question.bulkCreate(
        batch.map(q => ({
          statement:  q.statement.trim(),
          topic_id:   q.topic_id,
          difficulty: q.difficulty,
          source:     q.source  || null,
          year:       q.year    || null,
          bank:       q.bank    || null,
          created_by: null, // questões do banco geral
        })),
        { transaction: t, returning: true }
      );

      // Inserir alternativas de todas as questões do lote
      const alternatives = [];
      for (let j = 0; j < created.length; j++) {
        for (const alt of batch[j].alternatives) {
          alternatives.push({
            question_id: created[j].id,
            letter:      alt.letter,
            text:        alt.text.trim(),
            is_correct:  alt.is_correct,
          });
        }
      }
      await Alternative.bulkCreate(alternatives, { transaction: t });

      await t.commit();
      inserted += created.length;
      console.log(`✅`);
    } catch (err) {
      await t.rollback();
      failed += batch.length;
      console.log(`❌  Erro: ${err.message}`);
    }
  }

  // 6. Resumo final
  console.log('\n─────────────────────────────────────────');
  console.log(`✅  Importadas com sucesso: ${inserted}`);
  if (failed > 0)   console.log(`❌  Falhas:                  ${failed}`);
  if (skipped.length > 0) console.log(`⚠️   Ignoradas (inválidas):  ${skipped.length}`);
  console.log(`📦  Total no arquivo:        ${raw.length}`);
  console.log('─────────────────────────────────────────\n');

  await sequelize.close();
}

main().catch(err => {
  console.error('\n❌  Erro fatal:', err.message);
  process.exit(1);
});
