-- =====================================================================
-- 017_certificate_number_fn.sql
-- Sequential certificate numbers for the Certificates refactor (A-2).
--
-- SAFE TO RUN ON THE LIVE DB:
--   • Only adds one function (CREATE OR REPLACE) + a grant. No table,
--     column or row is touched.
--   • Idempotent — re-running it just replaces the function with itself.
--   • Uses certificate_number_seq, created in migration 016.
--
-- WHY: the app currently builds certificate numbers with Math.random(),
-- which can collide. This function hands out a gap-free, monotonic number
-- from the sequence, formatted CERT-<year>-<5 digits> (e.g. CERT-2026-00001).
--
-- The app calls it as  supabase.rpc('generate_certificate_number').
-- Until this is applied, the app safely falls back to a random number, so
-- nothing breaks whether you run this before or after pushing the A-2 code.
--
-- HOW TO RUN: Supabase → SQL Editor → paste → Run.
-- =====================================================================

CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  n integer;
BEGIN
  n := nextval('public.certificate_number_seq');
  RETURN 'CERT-' || EXTRACT(year FROM CURRENT_DATE)::text
         || '-' || LPAD(n::text, 5, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.generate_certificate_number() TO authenticated;

-- =====================================================================
-- Rollback (if ever needed):
--   DROP FUNCTION IF EXISTS public.generate_certificate_number();
-- =====================================================================
