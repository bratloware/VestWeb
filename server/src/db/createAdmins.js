import 'dotenv/config';
import sequelize from './index.js';
import Student from './models/Student.js';
import { hashPassword } from '../services/hashService.js';

const admins = [
  { name: 'Otávio Borges', email: 'otavioborges@VestWeb.com', enrollment: 'otavioborges', password: '123otavio' },
  { name: 'Luis Filipe',   email: 'luisfilipe@VestWeb.com',   enrollment: 'luisfilipe',   password: '123luis'   },
];

async function run() {
  await sequelize.authenticate();

  for (const a of admins) {
    const existing = await Student.findOne({ where: { enrollment: a.enrollment } });
    if (existing) {
      await existing.update({ role: 'admin' });
      console.log(`✔ Atualizado para admin: ${a.name} (${a.enrollment})`);
      continue;
    }

    const password_hash = await hashPassword(a.password);
    await Student.create({
      name: a.name,
      email: a.email,
      enrollment: a.enrollment,
      password_hash,
      role: 'admin',
    });
    console.log(`✔ Admin criado: ${a.name} (${a.enrollment})`);
  }

  await sequelize.close();
  console.log('Concluído.');
}

run().catch(err => { console.error(err); process.exit(1); });
