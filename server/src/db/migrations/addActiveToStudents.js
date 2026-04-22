import 'dotenv/config';
import sequelize from '../index.js';

async function run() {
  await sequelize.authenticate();
  const qi = sequelize.getQueryInterface();

  try {
    await qi.addColumn('students', 'active', {
      type: 'BOOLEAN',
      allowNull: false,
      defaultValue: true,
    });
    console.log('✔ Coluna `active` adicionada à tabela students');
  } catch (e) {
    if (e.message?.includes('already exists')) {
      console.log('ℹ Coluna `active` já existe — nada a fazer');
    } else {
      throw e;
    }
  }

  await sequelize.close();
}

run().catch(err => { console.error(err); process.exit(1); });
