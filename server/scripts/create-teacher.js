import 'dotenv/config';
import bcrypt from 'bcrypt';
import sequelize from '../src/db/index.js';
import Teacher from '../src/db/models/Teacher.js';

const enrollment = 'VW-PROF-002';
const password = 'lfc123';
const name = 'Professor VW-PROF-002';
const email = `vw-prof-002@vestweb.com`;

const run = async () => {
  await sequelize.authenticate();
  const password_hash = await bcrypt.hash(password, 10);
  const teacher = await Teacher.create({ name, email, enrollment, password_hash });
  console.log('Professor criado com sucesso:', { id: teacher.id, enrollment: teacher.enrollment, email: teacher.email });
  await sequelize.close();
};

run().catch((err) => { console.error(err); process.exit(1); });
