-- =====================================================
-- Migration 008: Messages & Communication System
-- Simple teacher-parent communication with WhatsApp + Email
-- =====================================================

-- Messages table (simple design)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Individual or Class message
  message_type TEXT NOT NULL CHECK (message_type IN ('individual', 'class')),
  
  -- For individual messages
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  parent_contact_type TEXT CHECK (parent_contact_type IN ('father', 'mother', 'both')),
  
  -- For class messages
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  
  -- Parent info (stored for history)
  parent_name TEXT,
  parent_phone TEXT,
  parent_email TEXT,
  
  -- Message content
  subject TEXT,
  message TEXT NOT NULL,
  template_used TEXT, -- Template name if used
  
  -- Delivery method
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'whatsapp_individual', 'whatsapp_group')),
  
  -- Email tracking
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP,
  email_error TEXT,
  
  -- WhatsApp tracking
  whatsapp_link_generated BOOLEAN DEFAULT false,
  whatsapp_message_copied BOOLEAN DEFAULT false,
  whatsapp_copied_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Message templates
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('progress', 'attendance', 'financial', 'announcement', 'general')),
  subject TEXT,
  body TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false, -- System templates can't be deleted
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Events calendar (simple)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  end_time TIME,
  location TEXT,
  event_type TEXT DEFAULT 'general' CHECK (event_type IN ('holiday', 'exam', 'meeting', 'celebration', 'general')),
  
  -- Visibility
  show_to_all BOOLEAN DEFAULT true,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE, -- NULL = school-wide
  visible_to_parents BOOLEAN DEFAULT true,
  
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_student ON messages(student_id);
CREATE INDEX idx_messages_class ON messages(class_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_type ON messages(message_type);

CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_class ON events(class_id);
CREATE INDEX idx_events_visible ON events(visible_to_parents);

CREATE INDEX idx_templates_category ON message_templates(category);
CREATE INDEX idx_templates_system ON message_templates(is_system);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Messages: Teachers and admins can view/create
CREATE POLICY "Teachers and admins can view messages"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Teachers and admins can create messages"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Senders can update their messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Templates: Everyone can view, admins can manage
CREATE POLICY "Everyone can view templates"
  ON message_templates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage templates"
  ON message_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Events: Everyone can view visible events
CREATE POLICY "Everyone can view visible events"
  ON events FOR SELECT
  USING (visible_to_parents = true);

CREATE POLICY "Teachers and admins can create events"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Creators can update events"
  ON events FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DEFAULT TEMPLATES
-- =====================================================

INSERT INTO message_templates (name, category, subject, body, is_system) VALUES
(
  'Weekly Progress',
  'progress',
  'Weekly Progress for {student_name}',
  'Assalamu Alaikum {parent_name},

{student_name} had a great week:
- Attendance: {attendance_rate}%
- Behaviour: Excellent
- Academic Progress: On track

JazakAllah Khair,
{teacher_name}',
  true
),
(
  'Good Attendance',
  'attendance',
  'Excellent Attendance - {student_name}',
  'Assalamu Alaikum {parent_name},

MashAllah! {student_name} has {attendance_rate}% attendance this month. Well done!

JazakAllah Khair,
{teacher_name}',
  true
),
(
  'Fee Reminder',
  'financial',
  'Fee Payment Reminder - {student_name}',
  'Assalamu Alaikum {parent_name},

Reminder: {student_name}''s fee payment of £{amount} is due on {due_date}.

You can view and download the invoice from your parent portal.

JazakAllah Khair,
Admin Team',
  true
),
(
  'School Closed',
  'announcement',
  'School Closure Notice',
  'Assalamu Alaikum Parents,

Reminder: School will be closed on {date} for {reason}.

Classes will resume on {resume_date}.

JazakAllah Khair,
Admin Team',
  true
),
(
  'Certificate Issued',
  'progress',
  'Certificate Awarded - {student_name}',
  'Assalamu Alaikum {parent_name},

Congratulations! {student_name} has been awarded a certificate for {achievement}.

You can view the certificate in your parent portal.

JazakAllah Khair,
{teacher_name}',
  true
),
(
  'Exam Reminder',
  'announcement',
  'Upcoming Exam - {subject}',
  'Assalamu Alaikum Parents,

Reminder: {subject} exam for {class_name} will be held on {exam_date}.

Please ensure students revise and arrive on time.

JazakAllah Khair,
{teacher_name}',
  true
);