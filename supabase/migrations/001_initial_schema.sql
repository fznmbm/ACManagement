-- =====================================================
-- MADRASA ATTENDANCE SYSTEM - DATABASE SCHEMA
-- Migration 001: Initial Tables
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: profiles
-- Extends auth.users with additional user information
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'teacher',
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT role_check CHECK (role IN ('super_admin', 'admin', 'teacher', 'parent'))
);

-- =====================================================
-- TABLE: classes
-- Stores class/group information
-- =====================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  level VARCHAR(100), -- e.g., "Beginner", "Intermediate", "Advanced"
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  capacity INTEGER DEFAULT 30,
  academic_year VARCHAR(20), -- e.g., "2024-2025"
  schedule JSONB, -- {days: ["Monday", "Wednesday"], time: "16:00-18:00"}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: students
-- Stores student information
-- =====================================================
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_number VARCHAR(50) UNIQUE, -- Auto-generated student ID
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  arabic_name VARCHAR(255), -- For Islamic names in Arabic
  date_of_birth DATE,
  gender VARCHAR(10) NOT NULL,
  
  -- Parent/Guardian Information
  parent_name VARCHAR(255) NOT NULL,
  parent_email VARCHAR(255),
  parent_phone VARCHAR(20) NOT NULL,
  parent_phone_secondary VARCHAR(20),
  parent_telegram_id VARCHAR(100), -- For Telegram notifications
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- Academic Information
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  
  -- Additional Information
  photo_url TEXT,
  medical_notes TEXT,
  notes TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT gender_check CHECK (gender IN ('male', 'female')),
  CONSTRAINT status_check CHECK (status IN ('active', 'inactive', 'graduated', 'withdrawn'))
);

-- =====================================================
-- TABLE: subjects
-- Stores subject/course information
-- =====================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_arabic VARCHAR(255),
  description TEXT,
  subject_type VARCHAR(50), -- e.g., "Quran", "Arabic", "Islamic Studies", "Fiqh"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: attendance
-- Stores daily attendance records
-- =====================================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Attendance Status
  status VARCHAR(20) NOT NULL DEFAULT 'present',
  
  -- Session Information
  session_type VARCHAR(50) DEFAULT 'regular', -- regular, prayer, special
  session_time VARCHAR(20), -- e.g., "morning", "afternoon", "Fajr", "Dhuhr"
  
  -- Additional Information
  arrival_time TIME,
  departure_time TIME,
  notes TEXT,
  
  -- Tracking
  marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT status_check CHECK (status IN ('present', 'absent', 'late', 'excused', 'sick')),
  CONSTRAINT session_type_check CHECK (session_type IN ('regular', 'prayer', 'quran', 'special')),
  
  -- Prevent duplicate attendance for same student, date, and session
  UNIQUE(student_id, date, session_type, session_time)
);

-- =====================================================
-- TABLE: quran_progress
-- Tracks Quran memorization and recitation progress
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quran_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  
  -- Surah Information
  surah_number INTEGER NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  surah_name VARCHAR(100) NOT NULL,
  surah_name_arabic VARCHAR(100),
  
  -- Progress Details
  verses_memorized INTEGER DEFAULT 0,
  verses_total INTEGER NOT NULL,
  progress_type VARCHAR(20) DEFAULT 'memorization', -- memorization, recitation, revision
  
  -- Assessment
  proficiency_level VARCHAR(20), -- beginner, intermediate, advanced, mastered
  teacher_notes TEXT,
  
  -- Dates
  started_date DATE DEFAULT CURRENT_DATE,
  completed_date DATE,
  last_revision_date DATE,
  
  -- Tracking
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT progress_type_check CHECK (progress_type IN ('memorization', 'recitation', 'revision', 'tajweed')),
  CONSTRAINT proficiency_check CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'mastered'))
);

-- =====================================================
-- TABLE: academic_progress
-- Tracks general academic progress and assessments
-- =====================================================
CREATE TABLE IF NOT EXISTS public.academic_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  
  -- Assessment Details
  assessment_type VARCHAR(50), -- test, quiz, homework, project, oral
  assessment_date DATE DEFAULT CURRENT_DATE,
  
  -- Grading (flexible - can use percentage or letter grade)
  score DECIMAL(5,2), -- e.g., 85.50
  max_score DECIMAL(5,2), -- e.g., 100.00
  grade VARCHAR(5), -- e.g., "A", "B+", "Excellent"
  
  -- Additional Information
  topic VARCHAR(255),
  notes TEXT,
  teacher_feedback TEXT,
  
  -- Tracking
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: notifications
-- Stores notification history for parents
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Recipient
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  recipient_type VARCHAR(20) DEFAULT 'parent', -- parent, teacher, admin
  
  -- Notification Details
  notification_type VARCHAR(50) NOT NULL, -- attendance_alert, progress_update, announcement, reminder
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Delivery
  delivery_method VARCHAR(20), -- email, sms, telegram, app
  delivery_status VARCHAR(20) DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional Data
  metadata JSONB, -- Store additional context
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT delivery_method_check CHECK (delivery_method IN ('email', 'sms', 'telegram', 'app', 'whatsapp')),
  CONSTRAINT delivery_status_check CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'read'))
);

-- =====================================================
-- TABLE: system_settings
-- Stores application-wide settings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(50), -- general, notification, academic, security
  is_public BOOLEAN DEFAULT false, -- Can non-admin users see this?
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: audit_logs
-- Tracks all important system actions for security
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- create, update, delete, login, etc.
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- Profiles
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Classes
CREATE INDEX idx_classes_teacher ON public.classes(teacher_id);
CREATE INDEX idx_classes_active ON public.classes(is_active);

-- Students
CREATE INDEX idx_students_class ON public.students(class_id);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_students_name ON public.students(last_name, first_name);
CREATE INDEX idx_students_parent_email ON public.students(parent_email);

-- Attendance
CREATE INDEX idx_attendance_student ON public.attendance(student_id);
CREATE INDEX idx_attendance_date ON public.attendance(date DESC);
CREATE INDEX idx_attendance_class ON public.attendance(class_id);
CREATE INDEX idx_attendance_status ON public.attendance(status);
CREATE INDEX idx_attendance_student_date ON public.attendance(student_id, date DESC);

-- Quran Progress
CREATE INDEX idx_quran_progress_student ON public.quran_progress(student_id);
CREATE INDEX idx_quran_progress_surah ON public.quran_progress(surah_number);

-- Academic Progress
CREATE INDEX idx_academic_progress_student ON public.academic_progress(student_id);
CREATE INDEX idx_academic_progress_subject ON public.academic_progress(subject_id);

-- Notifications
CREATE INDEX idx_notifications_student ON public.notifications(student_id);
CREATE INDEX idx_notifications_status ON public.notifications(delivery_status);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

-- Audit Logs
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- =====================================================
-- FUNCTIONS: Automatic Updated_at Timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.quran_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.academic_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- FUNCTION: Auto-generate Student Number
-- =====================================================

-- Fix for the student number generation function
--DROP FUNCTION IF EXISTS public.generate_student_number() CASCADE;

CREATE OR REPLACE FUNCTION public.generate_student_number()
RETURNS TRIGGER AS $$
DECLARE
  year_code VARCHAR(4);
  sequence_num VARCHAR(6);
  max_number INTEGER;
BEGIN
  IF NEW.student_number IS NULL THEN
    year_code := TO_CHAR(CURRENT_DATE, 'YY');
    
    -- Get the maximum number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(student_number FROM 3) AS INTEGER)), 0)
    INTO max_number
    FROM public.students
    WHERE student_number LIKE year_code || '%';
    
    -- Format the new number
    sequence_num := LPAD((max_number + 1)::TEXT, 6, '0');
    
    NEW.student_number := year_code || sequence_num;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS generate_student_number_trigger ON public.students;

CREATE TRIGGER generate_student_number_trigger
BEFORE INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.generate_student_number();
-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database schema created successfully!';
  RAISE NOTICE '📊 Tables created: 11';
  RAISE NOTICE '🔍 Indexes created: 18';
  RAISE NOTICE '⚡ Triggers created: 9';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run RLS policies (Migration 002)';
END $$;