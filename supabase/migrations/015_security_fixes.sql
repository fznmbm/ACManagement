-- =====================================================================
-- 015_security_fixes.sql   (Al Hikmah ACManagement — Zip 1, 1 Oct 2026)
-- Written against the LIVE production schema (schema_export, 1 Oct 2026)
-- and tested on a replica built from it.
--
-- HOW TO RUN (Supabase SQL editor):
--   1. Run STEP 0 on its own. Read the output.
--   2. Run STEPS 1-7 inside ONE transaction:  BEGIN; ... COMMIT;
--      If anything looks wrong, ROLLBACK; nothing is half-applied.
--   3. Keep 015_rollback.sql to undo.
-- Safe for existing data: no row is deleted or rewritten.
-- =====================================================================


-- =====================================================================
-- STEP 0 — READ-ONLY CHECKS (run first, on its own)
-- =====================================================================

-- 0a. Tables with RLS OFF (each row = open to the anon key)
SELECT relname AS table_rls_off
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
ORDER BY 1;

-- 0b. The catch-all policies this migration removes (so you can see them first)
SELECT tablename, policyname, cmd, array_to_string(roles, ',') AS roles, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN (
    'Users can view fines','Users can view fee invoices','Users can view fee payments',
    'Users can view student fee assignments','Authenticated users can view profiles',
    'authenticated_all')
ORDER BY tablename, policyname;

-- 0c. Views that any logged-in user / anon can currently read
SELECT table_name
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee = 'anon'
  AND table_name IN ('student_fee_summary','student_fine_summary','student_prayer_summary','parent_portal_status')
GROUP BY table_name;


-- =====================================================================
-- STEP 1 — Turn RLS on where it is OFF
-- parent_student_links and parent_notification_preferences already HAVE
-- correct policies; RLS is simply disabled, so they are wide open.
-- =====================================================================
ALTER TABLE public.parent_student_links            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_notification_preferences ENABLE ROW LEVEL SECURITY;


-- =====================================================================
-- STEP 2 — Remove the "any logged-in user can see everything" rules.
-- Correct per-family / per-role policies already sit beside each of
-- these, and PostgreSQL OR's permissive policies, so the catch-all is
-- what currently leaks. Dropping it lets the correct rule take over.
-- =====================================================================
DROP POLICY IF EXISTS "Users can view fines"                    ON public.fines;
DROP POLICY IF EXISTS "Users can view fee invoices"             ON public.fee_invoices;
DROP POLICY IF EXISTS "Users can view fee payments"             ON public.fee_payments;
DROP POLICY IF EXISTS "Users can view student fee assignments"  ON public.student_fee_assignments;

-- subjects + student_memorization: a FOR ALL catch-all lets any parent
-- write/delete. Correct teacher/admin policies already exist.
DROP POLICY IF EXISTS authenticated_all ON public.subjects;
DROP POLICY IF EXISTS authenticated_all ON public.student_memorization;

-- student_fee_assignments has no per-family SELECT policy of its own, so
-- add one before the catch-all is gone (parents see their own children).
DROP POLICY IF EXISTS "Parents view own children fee assignments" ON public.student_fee_assignments;
CREATE POLICY "Parents view own children fee assignments"
  ON public.student_fee_assignments FOR SELECT TO authenticated
  USING (
    student_id IN (SELECT student_id FROM public.parent_student_links WHERE parent_user_id = auth.uid())
    OR public.is_teacher()   -- SECURITY DEFINER helper (admin/super_admin/teacher)
  );


-- =====================================================================
-- STEP 3 — profiles: a parent could read every staff & parent profile
-- (name, email, phone). Replace the blanket read with own + staff.
-- =====================================================================
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_teacher());   -- SECURITY DEFINER helper: admin/super_admin/teacher, no recursion
-- ("Users can view own profile" (auth.uid() = id OR is_admin()) stays as-is.)


-- =====================================================================
-- STEP 4 — The four summary views are owned by postgres and bypass RLS,
-- so anyone with the anon key reads them. security_invoker makes them
-- run as the caller, so the table RLS above applies. (PG15+ / Supabase.)
-- =====================================================================
ALTER VIEW public.student_fee_summary    SET (security_invoker = true);
ALTER VIEW public.student_fine_summary   SET (security_invoker = true);
ALTER VIEW public.student_prayer_summary SET (security_invoker = true);
-- parent_portal_status reads auth.users (admin-only screen). Keep it
-- invoker-run AND limit the grant to staff via a thin wrapper is overkill;
-- simplest safe step: stop anon/authenticated reading it directly.
REVOKE SELECT ON public.parent_portal_status FROM anon, authenticated;
-- The admin Students page reads it through the service role, which is
-- unaffected by this revoke. (If that page uses the anon client, see
-- CHANGES.md item P4 for the one-line switch to the service client.)


-- =====================================================================
-- STEP 5 — Stop a user changing their own (or anyone's) role.
-- The "Users can update own profile" policy has no column limit, so a
-- parent can set role = 'super_admin'. This trigger blocks it for the
-- browser/API roles; the SQL editor and service role are unaffected.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.prevent_role_self_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Only restrict real browser/API callers; NULL (SQL editor) and
    -- 'service_role' (server routes) are trusted.
    IF coalesce(auth.role(), '') NOT IN ('authenticated', 'anon') THEN
      RETURN NEW;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles
                   WHERE id = auth.uid() AND role = 'super_admin')
       OR auth.uid() = NEW.id THEN
      RAISE EXCEPTION 'Not allowed to change role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_self_change ON public.profiles;
CREATE TRIGGER trg_prevent_role_self_change
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_change();

-- New signups should NOT become staff by default.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent')   -- was 'teacher'
  );
  RETURN NEW;
END;
$$;


-- =====================================================================
-- STEP 6 — Money & attendance integrity
-- =====================================================================

-- 6a. Fine trigger should fire only when status actually BECOMES late/absent,
--     not on every note edit. (Was: AFTER INSERT OR UPDATE, any column.)
DROP TRIGGER IF EXISTS trigger_auto_generate_fine ON public.attendance;
DROP TRIGGER IF EXISTS trigger_auto_generate_fine_ins ON public.attendance;
DROP TRIGGER IF EXISTS trigger_auto_generate_fine_upd ON public.attendance;
CREATE TRIGGER trigger_auto_generate_fine_ins
  AFTER INSERT ON public.attendance
  FOR EACH ROW WHEN (NEW.status IN ('late','absent'))
  EXECUTE FUNCTION auto_generate_fine();
CREATE TRIGGER trigger_auto_generate_fine_upd
  AFTER UPDATE OF status ON public.attendance
  FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('late','absent'))
  EXECUTE FUNCTION auto_generate_fine();

-- 6b. One atomic "save the register" call: updates in place, never deletes
--     attendance, removes only UNPAID fines when a status is corrected, so
--     paid fines and duplicate rows can no longer happen.
--     p_records: [{"student_id":"...","status":"present","notes":null}, ...]
CREATE OR REPLACE FUNCTION public.save_class_attendance(
  p_class_id UUID, p_date DATE, p_records JSONB
) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r JSONB; v_id UUID; v_old TEXT; v_count INTEGER := 0;
BEGIN
  IF NOT (public.is_admin()
          OR p_class_id IN (SELECT public.get_teacher_class_ids())) THEN
    RAISE EXCEPTION 'Not allowed to mark attendance for this class';
  END IF;
  FOR r IN SELECT * FROM jsonb_array_elements(p_records) LOOP
    SELECT id, status INTO v_id, v_old FROM attendance
      WHERE student_id = (r->>'student_id')::uuid
        AND date = p_date AND session_type = 'regular';
    IF v_id IS NULL THEN
      INSERT INTO attendance (student_id, class_id, date, status, session_type, notes, marked_by)
      VALUES ((r->>'student_id')::uuid, p_class_id, p_date, r->>'status',
              'regular', NULLIF(r->>'notes',''), auth.uid());
    ELSE
      IF v_old IS DISTINCT FROM (r->>'status') THEN
        DELETE FROM fines WHERE attendance_record_id = v_id AND status = 'pending';
      END IF;
      UPDATE attendance
        SET status = r->>'status', class_id = p_class_id,
            notes = NULLIF(r->>'notes',''), marked_by = auth.uid(), updated_at = now()
        WHERE id = v_id;
    END IF;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.save_class_attendance(UUID, DATE, JSONB) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.save_class_attendance(UUID, DATE, JSONB) TO authenticated;

-- 6c. Deleting a payment must recompute invoice status (trigger fired only
--     for NEW; on DELETE, NEW is null so it did nothing). Make it use the
--     surviving row and recompute from the real total.
CREATE OR REPLACE FUNCTION public.update_invoice_status()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_invoice UUID; total_paid NUMERIC; invoice_amount NUMERIC; new_status TEXT;
BEGIN
  v_invoice := COALESCE(NEW.invoice_id, OLD.invoice_id);
  SELECT COALESCE(SUM(amount), 0) INTO total_paid FROM fee_payments WHERE invoice_id = v_invoice;
  SELECT amount_due INTO invoice_amount FROM fee_invoices WHERE id = v_invoice;
  IF total_paid >= invoice_amount THEN new_status := 'paid';
  ELSIF total_paid > 0 THEN new_status := 'partial';
  ELSE new_status := 'pending'; END IF;
  UPDATE fee_invoices SET amount_paid = total_paid, status = new_status WHERE id = v_invoice;
  RETURN NULL;
END;
$$;

-- 6d. create_parent_notification only told ONE parent. Notify every linked
--     parent who accepts notifications. Returns the first id (callers ignore it).
CREATE OR REPLACE FUNCTION public.create_parent_notification(
  p_student_id UUID, p_type TEXT, p_priority TEXT, p_title TEXT, p_message TEXT,
  p_link_type TEXT DEFAULT NULL, p_link_id UUID DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE v_link RECORD; v_first UUID; v_id UUID;
BEGIN
  FOR v_link IN
    SELECT parent_user_id FROM parent_student_links
    WHERE student_id = p_student_id AND COALESCE(can_receive_notifications, true) = true
  LOOP
    INSERT INTO parent_notifications (parent_user_id, student_id, type, priority, title, message, link_type, link_id)
    VALUES (v_link.parent_user_id, p_student_id, p_type, p_priority, p_title, p_message, p_link_type, p_link_id)
    RETURNING id INTO v_id;
    v_first := COALESCE(v_first, v_id);
  END LOOP;
  RETURN v_first;
END;
$$;

-- 6e. cleanup_student_financial_records tried to set fines to 'cancelled',
--     which the CHECK constraint forbids. Use 'waived'.
CREATE OR REPLACE FUNCTION public.cleanup_student_financial_records(
  student_uuid UUID, cleanup_reason TEXT DEFAULT 'Student removed from system'
) RETURNS JSON LANGUAGE plpgsql AS $$
DECLARE cancelled_invoices INT := 0; ended_assignments INT := 0; cancelled_fines INT := 0;
BEGIN
  UPDATE fee_invoices SET status = 'cancelled',
    notes = COALESCE(notes,'') || ' | ' || cleanup_reason, updated_at = now()
  WHERE student_id = student_uuid AND status IN ('pending','partial','overdue');
  GET DIAGNOSTICS cancelled_invoices = ROW_COUNT;
  UPDATE student_fee_assignments SET is_active = false, end_date = CURRENT_DATE,
    notes = COALESCE(notes,'') || ' | ' || cleanup_reason
  WHERE student_id = student_uuid AND is_active = true;
  GET DIAGNOSTICS ended_assignments = ROW_COUNT;
  UPDATE fines SET status = 'waived',            -- was 'cancelled' (invalid)
    notes = COALESCE(notes,'') || ' | ' || cleanup_reason
  WHERE student_id = student_uuid AND status = 'pending';
  GET DIAGNOSTICS cancelled_fines = ROW_COUNT;
  RETURN json_build_object('success', true, 'cancelled_invoices', cancelled_invoices,
    'ended_assignments', ended_assignments, 'cancelled_fines', cancelled_fines,
    'cleanup_date', CURRENT_DATE, 'reason', cleanup_reason);
END;
$$;


-- =====================================================================
-- STEP 7 — Stop duplicate invoices for the same student/structure/period.
-- (resolve any existing duplicates first — STEP 0d below shows them.)
-- =====================================================================
-- 0d (run with STEP 0): SELECT student_id, fee_structure_id, period_start, COUNT(*)
--      FROM fee_invoices GROUP BY 1,2,3 HAVING COUNT(*) > 1;
CREATE UNIQUE INDEX IF NOT EXISTS fee_invoices_one_per_period
  ON public.fee_invoices (student_id, fee_structure_id, period_start);


-- =====================================================================
-- STEP 8 — Fast low-attendance count for the dashboard.
-- Replaces ~240 sequential queries (2 per active student) with one call.
-- Weekly school: look at each student's last N regular sessions.
-- The dashboard already falls back to 0 if this function is absent, so
-- applying it simply turns the alert on.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.low_attendance_students(
  p_sessions INTEGER DEFAULT 6, p_threshold NUMERIC DEFAULT 0.75
) RETURNS TABLE (student_id UUID, sessions INTEGER, attended INTEGER, rate NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH recent AS (
    SELECT a.student_id, a.status,
           row_number() OVER (PARTITION BY a.student_id ORDER BY a.date DESC) AS rn
    FROM attendance a
    JOIN students s ON s.id = a.student_id AND s.status = 'active'
    WHERE a.session_type = 'regular'
  )
  SELECT student_id, COUNT(*)::int,
         COUNT(*) FILTER (WHERE status IN ('present','late'))::int,
         ROUND(COUNT(*) FILTER (WHERE status IN ('present','late'))::numeric / COUNT(*), 2)
  FROM recent WHERE rn <= p_sessions
  GROUP BY student_id
  HAVING COUNT(*) >= 3
     AND COUNT(*) FILTER (WHERE status IN ('present','late'))::numeric / COUNT(*) < p_threshold;
$$;
REVOKE ALL ON FUNCTION public.low_attendance_students(INTEGER, NUMERIC) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.low_attendance_students(INTEGER, NUMERIC) TO authenticated, service_role;
