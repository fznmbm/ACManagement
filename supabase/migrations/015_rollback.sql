-- =====================================================================
-- 015_rollback.sql — undo 015_security_fixes.sql
-- Run inside BEGIN; ... COMMIT;  Restores the pre-015 behaviour.
-- Note: this re-opens the data leaks 015 closed; use only to back out.
-- =====================================================================

-- STEP 7
DROP INDEX IF EXISTS public.fee_invoices_one_per_period;

-- STEP 6a
DROP TRIGGER IF EXISTS trigger_auto_generate_fine_ins ON public.attendance;
DROP TRIGGER IF EXISTS trigger_auto_generate_fine_upd ON public.attendance;
CREATE TRIGGER trigger_auto_generate_fine
  AFTER INSERT OR UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION auto_generate_fine();

-- STEP 6b
DROP FUNCTION IF EXISTS public.save_class_attendance(UUID, DATE, JSONB);

-- STEP 6c–6e: these are safe improvements; leaving the fixed versions in
-- place does no harm, but to fully revert, restore from your pre-015 dump.

-- STEP 5
DROP TRIGGER IF EXISTS trg_prevent_role_self_change ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_role_self_change();
-- handle_new_user default role: restore to original if you must
--   (it set new users to 'teacher').

-- STEP 4
ALTER VIEW public.student_fee_summary    SET (security_invoker = false);
ALTER VIEW public.student_fine_summary   SET (security_invoker = false);
ALTER VIEW public.student_prayer_summary SET (security_invoker = false);
GRANT SELECT ON public.parent_portal_status TO anon, authenticated;

-- STEP 3
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT TO public USING (auth.uid() IS NOT NULL);

-- STEP 2
DROP POLICY IF EXISTS "Parents view own children fee assignments" ON public.student_fee_assignments;
CREATE POLICY "Users can view fines" ON public.fines FOR SELECT TO public USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view fee invoices" ON public.fee_invoices FOR SELECT TO public USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view fee payments" ON public.fee_payments FOR SELECT TO public USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view student fee assignments" ON public.student_fee_assignments FOR SELECT TO public USING (auth.role() = 'authenticated');
CREATE POLICY authenticated_all ON public.subjects FOR ALL TO public USING (auth.role() = 'authenticated');
CREATE POLICY authenticated_all ON public.student_memorization FOR ALL TO public USING (auth.role() = 'authenticated');

-- STEP 1
ALTER TABLE public.parent_student_links            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_notification_preferences DISABLE ROW LEVEL SECURITY;
