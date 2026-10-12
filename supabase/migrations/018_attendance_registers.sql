-- =====================================================================
-- 018_attendance_registers.sql
-- A-4: give each class-day register a real state (draft vs finalised) and
-- move the "clear day" cascade into one atomic function.
--
-- SAFE TO RUN ON THE LIVE DB:
--   • Adds ONE table + ONE function. No existing table/column/row is changed.
--   • Idempotent (IF NOT EXISTS / CREATE OR REPLACE). Transaction-wrapped.
--
-- The app degrades gracefully until this is applied: the Registers board
-- falls back to "any rows = Submitted", register status writes are best-effort
-- (the attendance rows still save), and Clear-day falls back to its old
-- client-side cascade. So it is safe to run this before OR after pushing the
-- A-4 code.
--
-- HOW TO RUN: Supabase → SQL Editor → paste → Run.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. ATTENDANCE_REGISTERS — one row per (class, date): the register's state.
--    'draft'     = marks saved, not yet finalised/notified
--    'finalized' = teacher tapped Finalise & notify
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_registers (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id     UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','finalized')),
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_registers_date
  ON public.attendance_registers(date);

ALTER TABLE public.attendance_registers ENABLE ROW LEVEL SECURITY;

-- Staff manage registers for classes they can mark (admins: all).
DROP POLICY IF EXISTS "registers_staff_all" ON public.attendance_registers;
CREATE POLICY "registers_staff_all" ON public.attendance_registers
  FOR ALL USING (
    public.is_admin()
    OR class_id IN (SELECT public.get_teacher_class_ids())
  )
  WITH CHECK (
    public.is_admin()
    OR class_id IN (SELECT public.get_teacher_class_ids())
  );

-- Any authenticated user may read register states (oversight board).
DROP POLICY IF EXISTS "registers_authenticated_read" ON public.attendance_registers;
CREATE POLICY "registers_authenticated_read" ON public.attendance_registers
  FOR SELECT USING (auth.uid() IS NOT NULL);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_registers TO authenticated;

-- ---------------------------------------------------------------------
-- 2. CLEAR_CLASS_DAY — atomic "clear this register" cascade.
--    Deletes pending fines for the day's attendance, then the attendance
--    rows, then the register state row — all or nothing. Paid/waived fines
--    are NEVER touched (the UI blocks clearing when any exist).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clear_class_day(
  p_class_id UUID, p_date DATE
) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ids UUID[];
  v_count INTEGER := 0;
BEGIN
  IF NOT (public.is_admin()
          OR p_class_id IN (SELECT public.get_teacher_class_ids())) THEN
    RAISE EXCEPTION 'Not allowed to clear this register';
  END IF;

  SELECT array_agg(id) INTO v_ids FROM attendance
    WHERE class_id = p_class_id AND date = p_date;

  IF v_ids IS NOT NULL THEN
    -- Safety: never delete a day that has settled (paid/waived) fines.
    IF EXISTS (SELECT 1 FROM fines
               WHERE attendance_record_id = ANY(v_ids)
                 AND status <> 'pending') THEN
      RAISE EXCEPTION 'SETTLED_FINES';
    END IF;

    DELETE FROM fines
      WHERE attendance_record_id = ANY(v_ids) AND status = 'pending';

    DELETE FROM attendance
      WHERE class_id = p_class_id AND date = p_date;
    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  DELETE FROM attendance_registers
    WHERE class_id = p_class_id AND date = p_date;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_class_day(UUID, DATE) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.clear_class_day(UUID, DATE) TO authenticated;

COMMIT;

-- =====================================================================
-- Rollback (if ever needed):
--   DROP FUNCTION IF EXISTS public.clear_class_day(UUID, DATE);
--   DROP TABLE IF EXISTS public.attendance_registers;
-- =====================================================================
