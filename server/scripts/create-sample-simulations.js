import 'dotenv/config';
import sequelize from '../src/db/index.js';
import { QueryTypes } from 'sequelize';
import { Simulation, SimulationQuestion } from '../src/db/models/index.js';

const TARGET_SIMULATIONS = [
  { subject: 'História', title: 'Simulado Exemplo - História', difficulty: 'mixed', timeLimitMinutes: 60 },
  { subject: 'Geografia', title: 'Simulado Exemplo - Geografia', difficulty: 'mixed', timeLimitMinutes: 60 },
  { subject: 'Biologia', title: 'Simulado Exemplo - Biologia', difficulty: 'mixed', timeLimitMinutes: 60 },
];

const QUESTIONS_PER_SIMULATION = 10;

const normalize = (text = '') =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

async function findSubjectByName(subjectName) {
  const subjects = await sequelize.query(
    `SELECT id, name FROM subjects ORDER BY id`,
    { type: QueryTypes.SELECT }
  );

  const target = normalize(subjectName);
  return subjects.find((s) => normalize(s.name) === target) || null;
}

async function findEligibleQuestionIds(subjectId) {
  const rows = await sequelize.query(
    `
      SELECT q.id
      FROM questions q
      WHERE q.subject_id = :subjectId
        AND EXISTS (
          SELECT 1
          FROM alternatives a
          WHERE a.question_id = q.id
        )
      ORDER BY q.id DESC
    `,
    {
      replacements: { subjectId },
      type: QueryTypes.SELECT,
    }
  );

  return rows.map((r) => Number(r.id));
}

async function upsertSimulationWithQuestions(target, questionIds, transaction) {
  const existing = await Simulation.findOne({
    where: { title: target.title },
    transaction,
  });

  let simulation = existing;

  if (!simulation) {
    simulation = await Simulation.create(
      {
        title: target.title,
        subject_id: target.subjectId,
        difficulty: target.difficulty,
        total_questions: QUESTIONS_PER_SIMULATION,
        time_limit_minutes: target.timeLimitMinutes,
        is_weekly: false,
        created_by: null,
      },
      { transaction }
    );
  } else {
    await simulation.update(
      {
        subject_id: target.subjectId,
        difficulty: target.difficulty,
        total_questions: QUESTIONS_PER_SIMULATION,
        time_limit_minutes: target.timeLimitMinutes,
        is_weekly: false,
      },
      { transaction }
    );
  }

  await SimulationQuestion.destroy({
    where: { simulation_id: simulation.id },
    transaction,
  });

  const links = questionIds.map((questionId, index) => ({
    simulation_id: simulation.id,
    question_id: questionId,
    order: index + 1,
  }));

  await SimulationQuestion.bulkCreate(links, { transaction });

  return simulation;
}

async function run() {
  console.log('Conectando ao banco...');
  await sequelize.authenticate();
  console.log('Conexao com banco estabelecida.');

  const tx = await sequelize.transaction();

  try {
    const results = [];

    for (const target of TARGET_SIMULATIONS) {
      const subject = await findSubjectByName(target.subject);

      if (!subject) {
        throw new Error(`Materia nao encontrada: ${target.subject}`);
      }

      const eligibleQuestionIds = await findEligibleQuestionIds(subject.id);

      if (eligibleQuestionIds.length < QUESTIONS_PER_SIMULATION) {
        throw new Error(
          `A materia ${subject.name} possui apenas ${eligibleQuestionIds.length} questoes validas. Necessario: ${QUESTIONS_PER_SIMULATION}.`
        );
      }

      const pickedQuestionIds = shuffle(eligibleQuestionIds).slice(0, QUESTIONS_PER_SIMULATION);

      const simulation = await upsertSimulationWithQuestions(
        { ...target, subjectId: subject.id },
        pickedQuestionIds,
        tx
      );

      results.push({
        simulationId: simulation.id,
        title: simulation.title,
        subject: subject.name,
        linkedQuestions: pickedQuestionIds.length,
      });
    }

    await tx.commit();

    console.log('Simulados de exemplo criados/atualizados com sucesso:');
    for (const result of results) {
      console.log(
        `- [${result.simulationId}] ${result.title} (${result.subject}) -> ${result.linkedQuestions} questoes`
      );
    }
  } catch (error) {
    await tx.rollback();
    console.error('Falha ao criar simulados de exemplo:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

run();
