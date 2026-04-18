/**
 * create-tables.js
 * Cria todas as tabelas que não existem no banco sem dropar nada.
 * Seguro de rodar mesmo com dados existentes.
 *
 * Uso: node scripts/create-tables.js
 */

import 'dotenv/config';
import sequelize from '../src/db/index.js';

// Importar todos os models dispara o registro das associações
import '../src/db/models/index.js';

async function main() {
  console.log('Conectando ao banco...');
  await sequelize.authenticate();
  console.log('Conexão OK');

  console.log('Criando tabelas ausentes (sync sem force)...');
  await sequelize.sync({ force: false });
  console.log('Tabelas sincronizadas com sucesso');

  await sequelize.close();
}

main().catch((err) => {
  console.error('Erro:', err.message);
  process.exit(1);
});
