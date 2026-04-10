-- Migration: performance indexes + one-correct constraint
-- Run ONCE against the production/dev database after deploying the updated models.
-- The ALTER TABLE columns are handled automatically by Sequelize sync({ alter: true }).
-- Only the partial unique index and trigger below require manual execution.

-- ─── Indexes (Sequelize sync will create these, but explicit SQL as fallback) ─────

CREATE INDEX IF NOT EXISTS idx_questions_topic_id      ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_questions_subtopic_id   ON questions(subtopic_id);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty    ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_year          ON questions(year);
CREATE INDEX IF NOT EXISTS idx_questions_bank          ON questions(bank);

CREATE INDEX IF NOT EXISTS idx_alternatives_question_id ON alternatives(question_id);

CREATE INDEX IF NOT EXISTS idx_answers_question_id     ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_session_id      ON answers(session_id);

CREATE INDEX IF NOT EXISTS idx_qv_vestibular_id        ON question_vestibulares(vestibular_id);

-- ─── Constraint: exactly ONE correct alternative per question ─────────────────────
-- PostgreSQL supports partial unique indexes natively.

CREATE UNIQUE INDEX IF NOT EXISTS uq_one_correct_per_question
  ON alternatives(question_id)
  WHERE is_correct = TRUE;

-- ─── New columns (fallback if sync didn't run yet) ────────────────────────────────

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS correct_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ DEFAULT NOW();

-- ─── Trigger: auto-update updated_at on questions ────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_questions_updated_at ON questions;
CREATE TRIGGER trg_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
