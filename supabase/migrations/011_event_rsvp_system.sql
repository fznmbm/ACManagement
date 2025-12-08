-- ============================================================================
-- MIGRATION: Event RSVP System
-- Description: Add RSVP functionality to events with flexible configurations
-- Version: 009
-- Date: December 2025
-- ============================================================================

-- ============================================================================
-- PART 1: EXTEND EVENTS TABLE
-- Add RSVP configuration columns to existing events table
-- ============================================================================

-- Add RSVP configuration columns
ALTER TABLE events 
  ADD COLUMN IF NOT EXISTS rsvp_required BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rsvp_type TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS rsvp_collect_age_breakdown BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rsvp_deadline TIMESTAMP,
  ADD COLUMN IF NOT EXISTS max_capacity INTEGER;

-- Add constraint for rsvp_type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'events_rsvp_type_check'
  ) THEN
    ALTER TABLE events 
    ADD CONSTRAINT events_rsvp_type_check 
    CHECK (rsvp_type IN ('none', 'adults_only', 'family', 'students_only'));
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN events.rsvp_required IS 'Whether this event requires RSVP from parents';
COMMENT ON COLUMN events.rsvp_type IS 'Type of RSVP: none, adults_only, family, students_only';
COMMENT ON COLUMN events.rsvp_collect_age_breakdown IS 'Whether to collect age breakdown (adults, under 12, under 5)';
COMMENT ON COLUMN events.rsvp_deadline IS 'Deadline for RSVPs';
COMMENT ON COLUMN events.max_capacity IS 'Maximum number of families/attendees';

-- ============================================================================
-- PART 2: CREATE EVENT RSVPS TABLE
-- Store parent responses to events
-- ============================================================================

CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  
  -- RSVP Status
  rsvp_status TEXT NOT NULL CHECK (rsvp_status IN ('attending', 'not_attending', 'maybe')),
  
  -- Age Breakdown (for family events)
  adults_count INTEGER DEFAULT 0 CHECK (adults_count >= 0),
  children_under_12_count INTEGER DEFAULT 0 CHECK (children_under_12_count >= 0),
  children_under_5_count INTEGER DEFAULT 0 CHECK (children_under_5_count >= 0),
  
  -- Additional Information
  notes TEXT,
  dietary_requirements TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- One RSVP per student per event (or one per parent for adults-only events)
  UNIQUE(event_id, parent_user_id, student_id)
);

-- Add comments
COMMENT ON TABLE event_rsvps IS 'Stores RSVP responses from parents for events';
COMMENT ON COLUMN event_rsvps.rsvp_status IS 'attending, not_attending, or maybe';
COMMENT ON COLUMN event_rsvps.adults_count IS 'Number of adults attending (for family events)';
COMMENT ON COLUMN event_rsvps.children_under_12_count IS 'Number of children under 12 (not enrolled)';
COMMENT ON COLUMN event_rsvps.children_under_5_count IS 'Number of children under 5 (not enrolled)';

-- ============================================================================
-- PART 3: INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_parent_user_id ON event_rsvps(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_student_id ON event_rsvps(student_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_status ON event_rsvps(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_events_rsvp_required ON events(rsvp_required) WHERE rsvp_required = TRUE;

-- ============================================================================
-- PART 4: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Parents can view own RSVPs" ON event_rsvps;
DROP POLICY IF EXISTS "Parents can insert own RSVPs" ON event_rsvps;
DROP POLICY IF EXISTS "Parents can update own RSVPs" ON event_rsvps;
DROP POLICY IF EXISTS "Parents can delete own RSVPs" ON event_rsvps;
DROP POLICY IF EXISTS "Staff can view all RSVPs" ON event_rsvps;
DROP POLICY IF EXISTS "Staff can manage all RSVPs" ON event_rsvps;

-- Parents can view their own RSVPs
CREATE POLICY "Parents can view own RSVPs"
ON event_rsvps FOR SELECT
TO authenticated
USING (parent_user_id = auth.uid());

-- Parents can insert their own RSVPs
CREATE POLICY "Parents can insert own RSVPs"
ON event_rsvps FOR INSERT
TO authenticated
WITH CHECK (parent_user_id = auth.uid());

-- Parents can update their own RSVPs
CREATE POLICY "Parents can update own RSVPs"
ON event_rsvps FOR UPDATE
TO authenticated
USING (parent_user_id = auth.uid())
WITH CHECK (parent_user_id = auth.uid());

-- Parents can delete their own RSVPs
CREATE POLICY "Parents can delete own RSVPs"
ON event_rsvps FOR DELETE
TO authenticated
USING (parent_user_id = auth.uid());

-- Staff (admin, super_admin, teacher) can view all RSVPs
CREATE POLICY "Staff can view all RSVPs"
ON event_rsvps FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin', 'teacher')
  )
);

-- Staff can manage all RSVPs (for admin purposes)
CREATE POLICY "Staff can manage all RSVPs"
ON event_rsvps FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- ============================================================================
-- PART 5: HELPER FUNCTIONS
-- ============================================================================

-- Function to get RSVP summary for an event
CREATE OR REPLACE FUNCTION get_event_rsvp_summary(event_uuid UUID)
RETURNS TABLE (
  total_families INTEGER,
  attending_families INTEGER,
  not_attending_families INTEGER,
  maybe_families INTEGER,
  no_response_families INTEGER,
  total_adults INTEGER,
  total_under_12 INTEGER,
  total_under_5 INTEGER,
  total_people INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH rsvp_counts AS (
    SELECT 
      COUNT(DISTINCT parent_user_id) FILTER (WHERE rsvp_status = 'attending') as attending,
      COUNT(DISTINCT parent_user_id) FILTER (WHERE rsvp_status = 'not_attending') as not_attending,
      COUNT(DISTINCT parent_user_id) FILTER (WHERE rsvp_status = 'maybe') as maybe,
      COALESCE(SUM(adults_count) FILTER (WHERE rsvp_status = 'attending'), 0) as adults,
      COALESCE(SUM(children_under_12_count) FILTER (WHERE rsvp_status = 'attending'), 0) as under_12,
      COALESCE(SUM(children_under_5_count) FILTER (WHERE rsvp_status = 'attending'), 0) as under_5,
      COUNT(DISTINCT CASE WHEN rsvp_status = 'attending' THEN student_id END) as attending_students
    FROM event_rsvps
    WHERE event_id = event_uuid
  ),
  total_families_count AS (
    SELECT COUNT(DISTINCT parent_user_id) as total
    FROM students
    WHERE status = 'active'
  )
  SELECT 
    (SELECT total FROM total_families_count)::INTEGER,
    COALESCE(rc.attending, 0)::INTEGER,
    COALESCE(rc.not_attending, 0)::INTEGER,
    COALESCE(rc.maybe, 0)::INTEGER,
    ((SELECT total FROM total_families_count) - COALESCE(rc.attending, 0) - COALESCE(rc.not_attending, 0) - COALESCE(rc.maybe, 0))::INTEGER,
    rc.adults::INTEGER,
    rc.under_12::INTEGER,
    rc.under_5::INTEGER,
    (rc.adults + rc.under_12 + rc.under_5 + rc.attending_students)::INTEGER
  FROM rsvp_counts rc;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_event_rsvp_summary IS 'Returns RSVP summary statistics for an event';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_event_rsvp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_event_rsvp_updated_at ON event_rsvps;
CREATE TRIGGER trigger_update_event_rsvp_updated_at
  BEFORE UPDATE ON event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_event_rsvp_updated_at();

-- ============================================================================
-- PART 6: UPDATE EXISTING EVENTS (OPTIONAL)
-- Set default RSVP types for existing events based on event_type
-- ============================================================================

-- Set default RSVP configuration for existing events
UPDATE events SET 
  rsvp_required = FALSE,
  rsvp_type = 'none'
WHERE rsvp_required IS NULL OR rsvp_type IS NULL;

-- You can optionally set smart defaults based on event type:
-- UPDATE events SET rsvp_required = TRUE, rsvp_type = 'adults_only' WHERE event_type = 'meeting';
-- UPDATE events SET rsvp_required = TRUE, rsvp_type = 'family', rsvp_collect_age_breakdown = TRUE WHERE event_type = 'celebration';
-- UPDATE events SET rsvp_required = FALSE, rsvp_type = 'none' WHERE event_type IN ('exam', 'holiday');

-- ============================================================================
-- PART 7: SAMPLE DATA (FOR TESTING - OPTIONAL)
-- Uncomment to insert test RSVP data
-- ============================================================================

/*
-- Sample RSVP for testing (requires valid event_id, parent_user_id, student_id)
INSERT INTO event_rsvps (event_id, parent_user_id, student_id, rsvp_status, adults_count, children_under_12_count, children_under_5_count, dietary_requirements)
VALUES 
  ('YOUR_EVENT_ID', 'YOUR_PARENT_ID', 'YOUR_STUDENT_ID', 'attending', 2, 1, 1, 'Halal food only, no nuts');
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration
DO $$ 
BEGIN
  RAISE NOTICE '✅ RSVP System Migration Complete!';
  RAISE NOTICE '📊 Added RSVP columns to events table';
  RAISE NOTICE '📊 Created event_rsvps table';
  RAISE NOTICE '🔒 Applied Row Level Security policies';
  RAISE NOTICE '⚡ Created indexes for performance';
  RAISE NOTICE '🔧 Created helper functions';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Update admin event creation form';
  RAISE NOTICE '2. Add RSVP buttons to parent calendar';
  RAISE NOTICE '3. Create admin RSVP dashboard';
END $$;