/**
 * migrate-add-columns.js
 *
 * Adiciona as colunas `number` e `image` à tabela questions, se não existirem.
 *
 * Uso:
 *   node scripts/migrate-add-columns.js
 */

import 'dotenv/config';
import sequelize from '../src/db/index.js';

async function main() {
  await sequelize.authenticate();
  console.log('Banco conectado.\n');

  const qi = sequelize.getQueryInterface();

  const columns = await qi.describeTable('questions');

  if (!columns.number) {
    await qi.addColumn('questions', 'number', {
      type: 'INTEGER',
      allowNull: true,
    });
    console.log('✅  Coluna "number" adicionada.');
  } else {
    console.log('ℹ️   Coluna "number" já existe.');
  }

  if (!columns.image) {
    await qi.addColumn('questions', 'image', {
      type: 'TEXT',
      allowNull: true,
    });
    console.log('✅  Coluna "image" adicionada.');
  } else {
    console.log('ℹ️   Coluna "image" já existe.');
  }

  await sequelize.close();
  console.log('\nMigração concluída.');
}

main().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
