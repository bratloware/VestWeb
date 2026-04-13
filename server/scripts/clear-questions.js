/**
 * clear-questions.js
 *
 * Remove todas as questões e alternativas do banco.
 *
 * Uso:
 *   node scripts/clear-questions.js
 */

import 'dotenv/config';
import sequelize from '../src/db/index.js';
import { Alternative, QuestionVestibular, QuestionSession, Question } from '../src/db/models/index.js';

async function main() {
  await sequelize.authenticate();
  console.log('Banco conectado.\n');

  const t = await sequelize.transaction();
  try {
    const alts = await Alternative.destroy({ where: {}, transaction: t });
    console.log(`Alternativas deletadas: ${alts}`);

    const qv = await QuestionVestibular.destroy({ where: {}, transaction: t });
    console.log(`QuestionVestibular deletadas: ${qv}`);

    const qs = await QuestionSession.destroy({ where: {}, transaction: t });
    console.log(`QuestionSession deletadas: ${qs}`);

    const questions = await Question.destroy({ where: {}, transaction: t });
    console.log(`Questões deletadas: ${questions}`);

    await t.commit();
    console.log('\nBanco limpo com sucesso.');
  } catch (err) {
    await t.rollback();
    console.error('Erro:', err.message);
    process.exit(1);
  }

  await sequelize.close();
}

main();
