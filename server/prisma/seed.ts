import { PrismaClient } from '@prisma/client';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));

const YEARS = Array.from({ length: 2025 - 2009 + 1 }, (_, i) => 2009 + i);

interface RawAlternative {
  letter: string;
  text: string;
  is_correct: boolean;
}

interface RawQuestion {
  statement: string;
  number: number;
  image: string | null;
  year: number;
  subject: string;
  alternatives: RawAlternative[];
}

function detectLanguage(subject: string): string | null {
  const s = subject.toLowerCase();
  if (s.includes('inglês') || s.includes('ingles')) return 'ingles';
  if (s.includes('espanhol')) return 'espanhol';
  return null;
}

async function main() {
  for (const year of YEARS) {
    const dataPath = resolve(__dirname, `../data/enem_${year}.json`);

    if (!existsSync(dataPath)) {
      console.log(`Skipping ${year} — file not found`);
      continue;
    }

    const questions: RawQuestion[] = JSON.parse(readFileSync(dataPath, 'utf8'));

    const disciplines = [...new Set(questions.map((q) => q.subject))];

    // Upsert Exam
    await prisma.exam.upsert({
      where: { year },
      update: { disciplines, languages: [] },
      create: { year, title: `ENEM ${year}`, disciplines, languages: [] },
    });

    console.log(`Exam ${year} upserted — ${questions.length} questions`);

    for (const q of questions) {
      const correctAlt = q.alternatives.find((a) => a.is_correct);
      const correctAlternative = correctAlt?.letter ?? '';
      const language = detectLanguage(q.subject);
      const files: string[] = q.image ? [q.image] : [];
      const title = `Questão ${q.number} - ENEM ${q.year}`;

      // findFirst handles the nullable language lookup correctly
      const existing = await prisma.question.findFirst({
        where: { year: q.year, index: q.number, language },
      });

      let questionId: number;

      if (existing) {
        await prisma.question.update({
          where: { id: existing.id },
          data: {
            title,
            discipline: q.subject,
            context: q.statement,
            files,
            correctAlternative,
          },
        });
        questionId = existing.id;
      } else {
        const created = await prisma.question.create({
          data: {
            title,
            index: q.number,
            year: q.year,
            discipline: q.subject,
            language,
            context: q.statement,
            files,
            correctAlternative,
            alternativesIntroduction: null,
          },
        });
        questionId = created.id;
      }

      // Delete and recreate alternatives for idempotency
      await prisma.alternative.deleteMany({ where: { questionId } });
      await prisma.alternative.createMany({
        data: q.alternatives.map((a) => ({
          letter: a.letter,
          text: a.text,
          file: null,
          isCorrect: a.is_correct,
          questionId,
        })),
      });
    }
  }

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
