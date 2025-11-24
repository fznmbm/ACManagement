-- =====================================================
-- AL HIKMA INSTITUTE - APPLICATIONS & PARENT PORTAL
-- Migration 007: Application System (Updated with Real Forms)
-- =====================================================

-- =====================================================
-- TABLE: applications (UPDATED)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  application_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Student Information (from Application Form)
  child_first_name VARCHAR(255) NOT NULL,
  child_last_name VARCHAR(255) NOT NULL,
  child_arabic_name VARCHAR(255),
  date_of_birth DATE NOT NULL,
  gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
  
  -- Parent/Guardian Information (from Application Form)
  parent_name VARCHAR(255) NOT NULL,
  parent_relationship VARCHAR(50) NOT NULL, -- e.g., "Father", "Mother", "Guardian"
  parent_phone VARCHAR(20) NOT NULL,
  parent_phone_alternate VARCHAR(20),
  parent_email VARCHAR(255) NOT NULL,
  
  -- Address (from Application Form)
  address TEXT NOT NULL,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  
  -- Application Details
  preferred_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  academic_year VARCHAR(20) NOT NULL,
  
  -- Additional Information (can add later)
  previous_islamic_education BOOLEAN DEFAULT false,
  medical_conditions TEXT,
  special_requirements TEXT,
  
  -- NEW: English Language Declaration (from Terms & Conditions)
  can_read_write_english BOOLEAN DEFAULT true,
  
  -- NEW: Consent & Declarations (from Application Form)
  parent_declaration_accepted BOOLEAN DEFAULT false,
  parent_declaration_date TIMESTAMP WITH TIME ZONE,
  parent_declaration_signature TEXT, -- Store signature data if needed
  
  -- NEW: Photo/Video Consent (from Photo Consent Form)
  photo_consent VARCHAR(20) CHECK (
    photo_consent IN ('photographs', 'video', 'both', 'none')
  ),
  photo_consent_granted_date TIMESTAMP WITH TIME ZONE,
  
  -- NEW: Terms & Conditions Acceptance (from T&C Document)
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_date TIMESTAMP WITH TIME ZONE,
  terms_version VARCHAR(20), -- Track which version of T&C was accepted
  
  -- Status Management
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'under_review', 'accepted', 'rejected', 'waitlist', 'withdrawn')
  ),
  
  -- Review Information
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_date TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  rejection_reason TEXT,
  
  -- Conversion to Student
  converted_to_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  converted_at TIMESTAMP WITH TIME ZONE,
  converted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: application_settings (UPDATED)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.application_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  academic_year VARCHAR(20) UNIQUE NOT NULL,
  
  -- Application Period
  application_open_date DATE NOT NULL,
  application_close_date DATE NOT NULL,
  
  -- Age Requirements (from Terms & Conditions)
  minimum_age INTEGER DEFAULT 7, -- Must be 7 years or older
  maximum_age INTEGER,
  age_calculation_date DATE, -- Date to calculate age
  
  -- NEW: English Language Requirement (from Terms & Conditions)
  require_english_literacy BOOLEAN DEFAULT true,
  
  -- NEW: Attendance Policy (from Terms & Conditions)
  max_absences_before_termination INTEGER DEFAULT 2,
  require_medical_proof_for_absence BOOLEAN DEFAULT true,
  
  -- Capacity & Limits
  max_applications INTEGER,
  current_applications_count INTEGER DEFAULT 0,
  
  -- Required Documents (for future)
  required_documents JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Email Templates
  confirmation_email_subject VARCHAR(255),
  confirmation_email_body TEXT,
  acceptance_email_subject VARCHAR(255),
  acceptance_email_body TEXT,
  rejection_email_subject VARCHAR(255),
  rejection_email_body TEXT,
  
  -- NEW: Current Terms Version
  current_terms_version VARCHAR(20) DEFAULT '1.0',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: parent_student_links (Keep as is)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  
  relationship VARCHAR(50) NOT NULL DEFAULT 'parent' CHECK (
    relationship IN ('father', 'mother', 'guardian', 'parent', 'other')
  ),
  is_primary BOOLEAN DEFAULT false,
  
  -- Permissions
  can_view_attendance BOOLEAN DEFAULT true,
  can_view_grades BOOLEAN DEFAULT true,
  can_view_financial BOOLEAN DEFAULT true,
  can_receive_notifications BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(parent_user_id, student_id)
);

-- =====================================================
-- TABLE: messages (Keep as is)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  category VARCHAR(50) DEFAULT 'general' CHECK (
    category IN ('general', 'attendance', 'fees', 'academic', 'behavior', 'medical', 'urgent')
  ),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (
    priority IN ('low', 'normal', 'high', 'urgent')
  ),
  
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  parent_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  attachments JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NEW TABLE: student_consents
-- Tracks photo/video and other consents for students
-- =====================================================
CREATE TABLE IF NOT EXISTS public.student_consents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  
  -- Photo/Video Consent (from Photo Consent Form)
  photo_consent BOOLEAN DEFAULT false,
  video_consent BOOLEAN DEFAULT false,
  media_usage_rights TEXT, -- "fundraising, publicity, social media, etc."
  
  -- Parent/Guardian who gave consent
  consented_by_name VARCHAR(255),
  consented_by_relationship VARCHAR(50),
  consent_signature TEXT, -- Store signature if digital
  consent_date DATE NOT NULL,
  
  -- Consent can be revoked
  consent_revoked BOOLEAN DEFAULT false,
  revoked_date DATE,
  revoked_by UUID REFERENCES public.profiles(id),
  
  -- Version tracking (in case forms change)
  consent_form_version VARCHAR(20) DEFAULT '1.0',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id) -- One consent record per student (updated if changed)
);

-- =====================================================
-- NEW TABLE: parent_meetings
-- Track parent meeting attendance (from T&C requirement)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.parent_meetings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Meeting Details
  meeting_date DATE NOT NULL,
  meeting_time TIME,
  meeting_title VARCHAR(255) NOT NULL,
  meeting_description TEXT,
  meeting_type VARCHAR(50) CHECK (
    meeting_type IN ('general', 'parent_teacher', 'emergency', 'orientation', 'graduation')
  ),
  
  -- Meeting Status
  is_mandatory BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,
  
  -- Related class (optional)
  class_id UUID REFERENCES public.classes(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NEW TABLE: parent_meeting_attendance
-- Track which parents attended which meetings
-- =====================================================
CREATE TABLE IF NOT EXISTS public.parent_meeting_attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.parent_meetings(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Attendance tracking
  attended BOOLEAN DEFAULT false,
  attendance_marked_at TIMESTAMP WITH TIME ZONE,
  marked_by UUID REFERENCES public.profiles(id),
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(meeting_id, parent_user_id)
);

-- =====================================================
-- TABLE: parent_notification_preferences (Keep as is)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.parent_notification_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  parent_user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Notification Channels
  email_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_number VARCHAR(20),
  
  -- Notification Types
  notify_attendance BOOLEAN DEFAULT true,
  notify_fees BOOLEAN DEFAULT true,
  notify_fines BOOLEAN DEFAULT true,
  notify_grades BOOLEAN DEFAULT true,
  notify_announcements BOOLEAN DEFAULT true,
  notify_messages BOOLEAN DEFAULT true,
  notify_meetings BOOLEAN DEFAULT true,
  
  -- Frequency
  daily_digest BOOLEAN DEFAULT false,
  weekly_summary BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Applications
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_academic_year ON public.applications(academic_year);
CREATE INDEX idx_applications_email ON public.applications(parent_email);
CREATE INDEX idx_applications_submission_date ON public.applications(submission_date DESC);
CREATE INDEX idx_applications_student_id ON public.applications(converted_to_student_id);

-- Application Settings
CREATE INDEX idx_application_settings_active ON public.application_settings(is_active);
CREATE INDEX idx_application_settings_year ON public.application_settings(academic_year);

-- Parent-Student Links
CREATE INDEX idx_parent_links_parent ON public.parent_student_links(parent_user_id);
CREATE INDEX idx_parent_links_student ON public.parent_student_links(student_id);
CREATE INDEX idx_parent_links_primary ON public.parent_student_links(is_primary);

-- Messages
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX idx_messages_student ON public.messages(student_id);
CREATE INDEX idx_messages_unread ON public.messages(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);

-- Student Consents
CREATE INDEX idx_student_consents_student ON public.student_consents(student_id);
CREATE INDEX idx_student_consents_revoked ON public.student_consents(consent_revoked);

-- Parent Meetings
CREATE INDEX idx_parent_meetings_date ON public.parent_meetings(meeting_date DESC);
CREATE INDEX idx_parent_meetings_type ON public.parent_meetings(meeting_type);
CREATE INDEX idx_parent_meetings_mandatory ON public.parent_meetings(is_mandatory);

-- Parent Meeting Attendance
CREATE INDEX idx_meeting_attendance_meeting ON public.parent_meeting_attendance(meeting_id);
CREATE INDEX idx_meeting_attendance_parent ON public.parent_meeting_attendance(parent_user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Auto-generate Application Number
CREATE OR REPLACE FUNCTION public.generate_application_number()
RETURNS TRIGGER AS $$
DECLARE
  year_code VARCHAR(4);
  sequence_num VARCHAR(6);
  max_number INTEGER;
BEGIN
  IF NEW.application_number IS NULL THEN
    year_code := TO_CHAR(CURRENT_DATE, 'YY');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(application_number FROM 7) AS INTEGER)), 0)
    INTO max_number
    FROM public.applications
    WHERE application_number LIKE 'APP-' || year_code || '%';
    
    sequence_num := LPAD((max_number + 1)::TEXT, 6, '0');
    NEW.application_number := 'APP-' || year_code || '-' || sequence_num;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_application_number_trigger
BEFORE INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.generate_application_number();

-- Update application count
CREATE OR REPLACE FUNCTION public.increment_application_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.application_settings
  SET current_applications_count = current_applications_count + 1
  WHERE academic_year = NEW.academic_year
    AND is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_application_count_trigger
AFTER INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.increment_application_count();

-- Create parent user when application accepted
CREATE OR REPLACE FUNCTION public.create_parent_user_from_application()
RETURNS TRIGGER AS $$
DECLARE
  parent_user_id UUID;
BEGIN
  IF NEW.status = 'accepted' 
     AND NEW.converted_to_student_id IS NOT NULL 
     AND OLD.status != 'accepted' THEN
    
    SELECT id INTO parent_user_id
    FROM public.profiles
    WHERE email = NEW.parent_email;
    
    IF parent_user_id IS NOT NULL THEN
      INSERT INTO public.parent_student_links (
        parent_user_id,
        student_id,
        relationship,
        is_primary
      ) VALUES (
        parent_user_id,
        NEW.converted_to_student_id,
        NEW.parent_relationship,
        true
      ) ON CONFLICT (parent_user_id, student_id) DO NOTHING;
      
      -- NEW: Create student consent record from application
      INSERT INTO public.student_consents (
        student_id,
        photo_consent,
        video_consent,
        consented_by_name,
        consented_by_relationship,
        consent_date
      ) VALUES (
        NEW.converted_to_student_id,
        NEW.photo_consent IN ('photographs', 'both'),
        NEW.photo_consent IN ('video', 'both'),
        NEW.parent_name,
        NEW.parent_relationship,
        CURRENT_DATE
      ) ON CONFLICT (student_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_parent_user_trigger
AFTER UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.create_parent_user_from_application();

-- Mark message as read
CREATE OR REPLACE FUNCTION public.mark_message_as_read()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mark_message_read_trigger
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.mark_message_as_read();

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.application_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.parent_student_links
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.student_consents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.parent_meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.parent_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- SEED DATA
-- =====================================================

INSERT INTO public.application_settings (
  academic_year,
  application_open_date,
  application_close_date,
  minimum_age,
  age_calculation_date,
  require_english_literacy,
  max_absences_before_termination,
  require_medical_proof_for_absence,
  max_applications,
  is_active,
  current_terms_version,
  confirmation_email_subject,
  confirmation_email_body
) VALUES (
  '2025-2026',
  '2025-01-01',
  '2025-08-31',
  7,
  '2025-09-01',
  true,
  2,
  true,
  100,
  true,
  '1.0',
  'Application Received - Al Hikma Institute Crawley',
  'Assalamu Alaikum {parent_name},

Thank you for submitting an application for {child_name} to Al Hikma Institute Crawley.

Your application number is: {application_number}

We have received your application and it is currently being reviewed. You will receive a response within 5-7 working days.

If you have any questions, please contact us.

JazakAllah Khair,
Al Hikma Institute Crawley'
) ON CONFLICT (academic_year) DO NOTHING;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Applications & Parent Portal schema created successfully!';
  RAISE NOTICE '📊 New tables: 8';
  RAISE NOTICE '  - applications (with photo consent & declarations)';
  RAISE NOTICE '  - application_settings (with T&C policies)';
  RAISE NOTICE '  - parent_student_links';
  RAISE NOTICE '  - messages';
  RAISE NOTICE '  - student_consents (NEW - for photo/video)';
  RAISE NOTICE '  - parent_meetings (NEW - track meetings)';
  RAISE NOTICE '  - parent_meeting_attendance (NEW)';
  RAISE NOTICE '  - parent_notification_preferences';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Indexes: 20+';
  RAISE NOTICE '⚡ Triggers: 8';
  RAISE NOTICE '📝 Functions: 4';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run RLS policies (Migration 008)';
END $$;