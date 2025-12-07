-- =====================================================
-- Migration 009: Parent Notifications System
-- Foundation for all parent communications
-- =====================================================

-- Parent notifications table
CREATE TABLE parent_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  
  -- Notification details
  type TEXT NOT NULL CHECK (type IN ('feedback', 'announcement', 'fee_alert', 'fine', 'certificate', 'attendance', 'event')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Links to related records
  link_type TEXT CHECK (link_type IN ('feedback', 'fee_invoice', 'certificate', 'event', 'fine')),
  link_id UUID, -- ID of linked record
  
  -- Read status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  
  -- Delivery tracking
  sent_via_whatsapp BOOLEAN DEFAULT false,
  whatsapp_sent_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Class feedback sessions table
CREATE TABLE class_feedback_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_time TIME,
  
  -- Class summary (optional)
  class_summary TEXT,
  homework TEXT,
  
  -- Created by
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(class_id, session_date)
);

-- Individual student feedback table
CREATE TABLE student_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES class_feedback_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Performance ratings (JSONB for flexibility)
  performance_ratings JSONB DEFAULT '{}'::jsonb,
  -- Example: {"quran": "excellent", "tajweed": "good", "behaviour": "excellent"}
  
  -- Feedback text
  feedback_text TEXT,
  
  -- Notification sent
  notification_sent BOOLEAN DEFAULT false,
  notification_id UUID REFERENCES parent_notifications(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(session_id, student_id)
);

-- Performance criteria configuration (what teachers rate)
CREATE TABLE performance_criteria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Options for dropdown
  rating_options JSONB DEFAULT '["excellent", "good", "needs_improvement"]'::jsonb,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(name)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_parent_notifications_user ON parent_notifications(parent_user_id);
CREATE INDEX idx_parent_notifications_student ON parent_notifications(student_id);
CREATE INDEX idx_parent_notifications_unread ON parent_notifications(parent_user_id, is_read, created_at DESC);
CREATE INDEX idx_parent_notifications_type ON parent_notifications(type, created_at DESC);
CREATE INDEX idx_parent_notifications_priority ON parent_notifications(priority, is_read);

CREATE INDEX idx_class_feedback_sessions_class ON class_feedback_sessions(class_id, session_date DESC);
CREATE INDEX idx_class_feedback_sessions_date ON class_feedback_sessions(session_date DESC);

CREATE INDEX idx_student_feedback_session ON student_feedback(session_id);
CREATE INDEX idx_student_feedback_student ON student_feedback(student_id, created_at DESC);

CREATE INDEX idx_performance_criteria_active ON performance_criteria(is_active, display_order);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE parent_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_feedback_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_criteria ENABLE ROW LEVEL SECURITY;

-- Parent notifications: Parents see their own, teachers/admins see all
CREATE POLICY "Parents can view their own notifications"
  ON parent_notifications FOR SELECT
  USING (
    parent_user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Teachers and admins can create notifications"
  ON parent_notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Parents can update their own notifications (mark as read)"
  ON parent_notifications FOR UPDATE
  USING (parent_user_id = auth.uid());

-- Class feedback sessions: Teachers/admins only
CREATE POLICY "Teachers and admins can manage feedback sessions"
  ON class_feedback_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin', 'super_admin')
    )
  );

-- Student feedback: Teachers/admins + parents can view their children's
CREATE POLICY "Teachers and admins can manage student feedback"
  ON student_feedback FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Parents can view their children's feedback"
  ON student_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM parent_student_links
      WHERE parent_student_links.parent_user_id = auth.uid()
      AND parent_student_links.student_id = student_feedback.student_id
    )
  );

-- Performance criteria: Everyone can view, only admins can manage
CREATE POLICY "Everyone can view performance criteria"
  ON performance_criteria FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage performance criteria"
  ON performance_criteria FOR ALL
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

-- Function to create notification for parent
CREATE OR REPLACE FUNCTION create_parent_notification(
  p_student_id UUID,
  p_type TEXT,
  p_priority TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link_type TEXT DEFAULT NULL,
  p_link_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_parent_user_id UUID;
  v_notification_id UUID;
BEGIN
  -- Get parent user ID from student
  SELECT parent_user_id INTO v_parent_user_id
  FROM parent_student_links
  WHERE student_id = p_student_id
  AND is_primary = true
  LIMIT 1;
  
  -- If no primary parent, get any parent
  IF v_parent_user_id IS NULL THEN
    SELECT parent_user_id INTO v_parent_user_id
    FROM parent_student_links
    WHERE student_id = p_student_id
    LIMIT 1;
  END IF;
  
  IF v_parent_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Create notification
  INSERT INTO parent_notifications (
    parent_user_id,
    student_id,
    type,
    priority,
    title,
    message,
    link_type,
    link_id
  ) VALUES (
    v_parent_user_id,
    p_student_id,
    p_type,
    p_priority,
    p_title,
    p_message,
    p_link_type,
    p_link_id
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread notification count for parent
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_parent_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM parent_notifications
  WHERE parent_user_id = p_parent_user_id
  AND is_read = false;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UPDATED_AT TRIGGERS
-- =====================================================

CREATE TRIGGER update_parent_notifications_updated_at
  BEFORE UPDATE ON parent_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_feedback_sessions_updated_at
  BEFORE UPDATE ON class_feedback_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_feedback_updated_at
  BEFORE UPDATE ON student_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_criteria_updated_at
  BEFORE UPDATE ON performance_criteria
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DEFAULT PERFORMANCE CRITERIA
-- =====================================================

INSERT INTO performance_criteria (name, display_order, rating_options) VALUES
('Quran', 1, '["excellent", "good", "needs_improvement"]'::jsonb),
('Tajweed', 2, '["excellent", "good", "needs_improvement"]'::jsonb),
('Behaviour', 3, '["excellent", "good", "needs_improvement"]'::jsonb),
('Participation', 4, '["excellent", "good", "needs_improvement"]'::jsonb);