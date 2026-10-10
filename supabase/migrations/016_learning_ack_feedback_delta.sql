-- =====================================================================
-- 016_learning_ack_feedback_delta.sql
-- Schema delta for: Learning refactor (exams/results), Certificates tidy,
-- Parent Seen/Acknowledged, and class-day feedback authorship.
--
-- SAFE TO RUN ON THE LIVE DB:
--   • Fully ADDITIVE — no column is dropped, no data is deleted or rewritten.
--   • IDEMPOTENT — re-running it is harmless (IF NOT EXISTS / guarded policies).
--   • Wrapped in a transaction — it all applies, or none of it does.
--
-- Nothing in the app reads these new objects until the matching code phases
-- ship. Run this first; then Claude builds the code against it.
--
-- HOW TO RUN: Supabase → SQL Editor → paste → Run.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. EXAMS  (Learning model: Class → Subject → Exam → Result)
--    A light table. Each exam belongs to a subject (and the class it was
--    taught in), has its own max marks, and may include a practical part.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exams (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id    UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id      UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  title         VARCHAR(255) NOT NULL,
  exam_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  has_practical BOOLEAN NOT NULL DEFAULT false,
  written_max   NUMERIC(6,2) NOT NULL DEFAULT 100,
  practical_max NUMERIC(6,2),                     -- null unless has_practical
  created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exams_subject ON public.exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_class_date ON public.exams(class_id, exam_date DESC);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Staff manage exams; any authenticated user may read them (results carry the
-- sensitive per-child data and are gated on academic_progress, not here).
DROP POLICY IF EXISTS "exams_staff_all" ON public.exams;
CREATE POLICY "exams_staff_all" ON public.exams
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('teacher','admin','super_admin'))
  );

DROP POLICY IF EXISTS "exams_authenticated_read" ON public.exams;
CREATE POLICY "exams_authenticated_read" ON public.exams
  FOR SELECT USING (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;

-- ---------------------------------------------------------------------
-- 2. ACADEMIC_PROGRESS  → becomes "Results"
--    Add the marks-based columns. The old score/max_score/grade columns are
--    LEFT IN PLACE (unused by the new UI) so existing rows are untouched.
-- ---------------------------------------------------------------------
ALTER TABLE public.academic_progress
  ADD COLUMN IF NOT EXISTS exam_id         UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS written_score   NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS practical_score NUMERIC(6,2);

CREATE INDEX IF NOT EXISTS idx_academic_progress_exam ON public.academic_progress(exam_id);

-- ---------------------------------------------------------------------
-- 3. CERTIFICATES  — record "printed externally" vs "generated", and give a
--    real sequence for certificate numbers (replaces the Math.random race).
--    The certificate_type CHECK is left unchanged: 'memorization_completion'
--    stays allowed in the DB (old rows keep working); the UI simply stops
--    offering it. No type is removed.
-- ---------------------------------------------------------------------
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'generated';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'certificates_source_check'
  ) THEN
    ALTER TABLE public.certificates
      ADD CONSTRAINT certificates_source_check
      CHECK (source IN ('generated','printed_externally'));
  END IF;
END $$;

-- Monotonic counter the app formats into a certificate number (e.g. CERT-000123).
CREATE SEQUENCE IF NOT EXISTS public.certificate_number_seq START 1;

-- ---------------------------------------------------------------------
-- 4. PARENT_NOTIFICATIONS  — Seen / Acknowledged model
--    seen_at      : stamped automatically when the parent opens the item
--                   (and, later, on a WhatsApp read receipt).
--    requires_ack : whether this item needs an explicit "I've seen this" tap.
--    acknowledged_at : when the parent tapped it.
-- ---------------------------------------------------------------------
ALTER TABLE public.parent_notifications
  ADD COLUMN IF NOT EXISTS seen_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS requires_ack    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_parent_notifications_ack
  ON public.parent_notifications(requires_ack, acknowledged_at);

-- ---------------------------------------------------------------------
-- 5. STUDENT_FEEDBACK  — who wrote each note (class-day collaboration)
--    No new role, no class_staff table. Just the author of the note, so the
--    feedback tool can show "— added by <name>" and never silently lose a note.
-- ---------------------------------------------------------------------
ALTER TABLE public.student_feedback
  ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_student_feedback_author ON public.student_feedback(author_id);

COMMIT;

-- =====================================================================
-- Rollback (only if you ever need it — destroys the new columns/table):
--   BEGIN;
--   ALTER TABLE public.student_feedback   DROP COLUMN IF EXISTS author_id;
--   ALTER TABLE public.parent_notifications DROP COLUMN IF EXISTS seen_at,
--     DROP COLUMN IF EXISTS requires_ack, DROP COLUMN IF EXISTS acknowledged_at;
--   ALTER TABLE public.certificates DROP COLUMN IF EXISTS source;
--   DROP SEQUENCE IF EXISTS public.certificate_number_seq;
--   ALTER TABLE public.academic_progress DROP COLUMN IF EXISTS exam_id,
--     DROP COLUMN IF EXISTS written_score, DROP COLUMN IF EXISTS practical_score;
--   DROP TABLE IF EXISTS public.exams;
--   COMMIT;
-- =====================================================================
