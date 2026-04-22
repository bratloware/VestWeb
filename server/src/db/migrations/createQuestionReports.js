import sequelize from '../index.js';

const sql = `
CREATE TABLE IF NOT EXISTS public.question_reports (
  id              SERIAL PRIMARY KEY,
  question_id     INTEGER NOT NULL,
  student_id      INTEGER NOT NULL,
  error_type      VARCHAR(30) NOT NULL
                    CHECK (error_type IN ('wrong_answer','typo','image_missing','unclear_statement','wrong_subject','other')),
  description     TEXT,
  status          VARCHAR(10) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','resolved','dismissed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qr_question ON public.question_reports(question_id);
CREATE INDEX IF NOT EXISTS idx_qr_student  ON public.question_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_qr_status   ON public.question_reports(status);
`;

try {
  await sequelize.query(sql);
  console.log('✅ question_reports table created');
} catch (err) {
  console.error('Migration failed:', err.message);
}

process.exit(0);
