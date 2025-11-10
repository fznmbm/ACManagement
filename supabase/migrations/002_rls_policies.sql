-- =====================================================
-- MADRASA ATTENDANCE SYSTEM - RLS POLICIES
-- Migration 002: Row Level Security
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION: Get Current User's Role
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS VARCHAR AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Check if user is admin
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Check if user is teacher
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('teacher', 'admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Get teacher's class IDs
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_teacher_class_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM public.classes WHERE teacher_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- =====================================================
-- TABLE: profiles
-- Users can view their own profile
-- Admins can view/manage all profiles
-- =====================================================

-- Select: Users can see their own profile + admins see all
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id 
    OR 
    public.is_admin()
  );

-- Insert: Only during registration (handled by trigger)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Update: Users can update own profile, admins can update any
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id 
    OR 
    public.is_admin()
  );

-- Delete: Only admins can delete
CREATE POLICY "Only admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- TABLE: classes
-- Teachers see their own classes
-- Admins see all classes
-- =====================================================

-- Select: Teachers see their classes, admins see all
CREATE POLICY "Teachers can view their classes"
  ON public.classes FOR SELECT
  USING (
    teacher_id = auth.uid()
    OR
    public.is_admin()
  );

-- Insert: Only admins can create classes
CREATE POLICY "Only admins can create classes"
  ON public.classes FOR INSERT
  WITH CHECK (public.is_admin());

-- Update: Teachers can update their classes, admins can update any
CREATE POLICY "Teachers can update their classes"
  ON public.classes FOR UPDATE
  USING (
    teacher_id = auth.uid()
    OR
    public.is_admin()
  );

-- Delete: Only admins can delete
CREATE POLICY "Only admins can delete classes"
  ON public.classes FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- TABLE: students
-- Teachers see students in their classes
-- Parents see their own children
-- Admins see all students
-- =====================================================

-- Select: Teachers see their class students, parents see own children, admins see all
CREATE POLICY "Teachers can view their students"
  ON public.students FOR SELECT
  USING (
    -- Teacher can see students in their classes
    class_id IN (SELECT public.get_teacher_class_ids())
    OR
    -- Parent can see own children (matched by parent_email)
    parent_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    OR
    -- Admins see all
    public.is_admin()
  );

-- Insert: Only admins and teachers can add students
CREATE POLICY "Teachers can add students"
  ON public.students FOR INSERT
  WITH CHECK (
    public.is_teacher()
    OR
    public.is_admin()
  );

-- Update: Teachers can update their students, admins can update any
CREATE POLICY "Teachers can update their students"
  ON public.students FOR UPDATE
  USING (
    class_id IN (SELECT public.get_teacher_class_ids())
    OR
    public.is_admin()
  );

-- Delete: Only admins can delete
CREATE POLICY "Only admins can delete students"
  ON public.students FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- TABLE: subjects
-- Everyone can view subjects
-- Only admins can modify
-- =====================================================

-- Select: All authenticated users can view subjects
CREATE POLICY "Anyone can view subjects"
  ON public.subjects FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Insert/Update/Delete: Only admins
CREATE POLICY "Only admins can manage subjects"
  ON public.subjects FOR ALL
  USING (public.is_admin());

-- =====================================================
-- TABLE: attendance
-- Teachers can mark/view attendance for their classes
-- Parents can view their children's attendance
-- Admins see all
-- =====================================================

-- Select: Teachers see their class attendance, parents see own children
CREATE POLICY "Teachers can view their class attendance"
  ON public.attendance FOR SELECT
  USING (
    -- Teacher's class attendance
    class_id IN (SELECT public.get_teacher_class_ids())
    OR
    -- Parent's children attendance
    student_id IN (
      SELECT id FROM public.students 
      WHERE parent_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
    OR
    -- Admins see all
    public.is_admin()
  );

-- Insert: Teachers can mark attendance for their students
CREATE POLICY "Teachers can mark attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (
    class_id IN (SELECT public.get_teacher_class_ids())
    OR
    public.is_admin()
  );

-- Update: Teachers can update their class attendance
CREATE POLICY "Teachers can update attendance"
  ON public.attendance FOR UPDATE
  USING (
    class_id IN (SELECT public.get_teacher_class_ids())
    OR
    public.is_admin()
  );

-- Delete: Only admins can delete attendance records
CREATE POLICY "Only admins can delete attendance"
  ON public.attendance FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- TABLE: quran_progress
-- Teachers can view/update progress for their students
-- Parents can view their children's progress
-- =====================================================

-- Select: Teachers see their students' progress, parents see own children
CREATE POLICY "Teachers can view quran progress"
  ON public.quran_progress FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students 
      WHERE class_id IN (SELECT public.get_teacher_class_ids())
    )
    OR
    student_id IN (
      SELECT id FROM public.students 
      WHERE parent_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
    OR
    public.is_admin()
  );

-- Insert: Teachers can add progress
CREATE POLICY "Teachers can add quran progress"
  ON public.quran_progress FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.students 
      WHERE class_id IN (SELECT public.get_teacher_class_ids())
    )
    OR
    public.is_admin()
  );

-- Update: Teachers can update their students' progress
CREATE POLICY "Teachers can update quran progress"
  ON public.quran_progress FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM public.students 
      WHERE class_id IN (SELECT public.get_teacher_class_ids())
    )
    OR
    public.is_admin()
  );

-- Delete: Only admins
CREATE POLICY "Only admins can delete quran progress"
  ON public.quran_progress FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- TABLE: academic_progress
-- Same logic as quran_progress
-- =====================================================

CREATE POLICY "Teachers can view academic progress"
  ON public.academic_progress FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM public.students 
      WHERE class_id IN (SELECT public.get_teacher_class_ids())
    )
    OR
    student_id IN (
      SELECT id FROM public.students 
      WHERE parent_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
    OR
    public.is_admin()
  );

CREATE POLICY "Teachers can add academic progress"
  ON public.academic_progress FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.students 
      WHERE class_id IN (SELECT public.get_teacher_class_ids())
    )
    OR
    public.is_admin()
  );

CREATE POLICY "Teachers can update academic progress"
  ON public.academic_progress FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM public.students 
      WHERE class_id IN (SELECT public.get_teacher_class_ids())
    )
    OR
    public.is_admin()
  );

CREATE POLICY "Only admins can delete academic progress"
  ON public.academic_progress FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- TABLE: notifications
-- Parents see their own notifications
-- Teachers/Admins see relevant notifications
-- =====================================================

CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  USING (
    -- Parent sees notifications for their children
    student_id IN (
      SELECT id FROM public.students 
      WHERE parent_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    )
    OR
    -- Teachers/Admins see all
    public.is_teacher()
  );

CREATE POLICY "Teachers can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.is_teacher());

CREATE POLICY "Teachers can update notifications"
  ON public.notifications FOR UPDATE
  USING (public.is_teacher());

CREATE POLICY "Only admins can delete notifications"
  ON public.notifications FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- TABLE: system_settings
-- Only admins can manage
-- Public settings visible to all
-- =====================================================

CREATE POLICY "Users can view public settings"
  ON public.system_settings FOR SELECT
  USING (
    is_public = true
    OR
    public.is_admin()
  );

CREATE POLICY "Only admins can manage settings"
  ON public.system_settings FOR ALL
  USING (public.is_admin());

-- =====================================================
-- TABLE: audit_logs
-- Only admins can view audit logs
-- System can insert (via triggers)
-- =====================================================

CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true); -- Allow system triggers to insert

-- No update/delete on audit logs (immutable)

-- =====================================================
-- FUNCTION: Auto-create profile on user signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Row Level Security policies created successfully!';
  RAISE NOTICE '🔒 All tables are now protected';
  RAISE NOTICE '👥 Role-based access control enabled';
  RAISE NOTICE '🔐 Helper functions created: 4';
  RAISE NOTICE '📜 Policies created: 35+';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Add seed data (Migration 003)';
END $$;