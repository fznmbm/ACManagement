-- =====================================================
-- Migration 010: Automated Alert Triggers
-- Auto-create notifications for key events
-- =====================================================

-- =====================================================
-- TRIGGER 1: Fine Issued Alert
-- When a fine is created, notify parent immediately
-- =====================================================

CREATE OR REPLACE FUNCTION notify_fine_issued()
RETURNS TRIGGER AS $$
DECLARE
  v_student_record RECORD;
  v_notification_id UUID;
BEGIN
  -- Get student details
  SELECT id, first_name, last_name, parent_name
  INTO v_student_record
  FROM students
  WHERE id = NEW.student_id;

  -- Create notification for parent
  SELECT create_parent_notification(
    NEW.student_id,
    'fine',
    'urgent',
    'Fine Issued - ' || v_student_record.first_name,
    'Assalamu Alaikum ' || v_student_record.parent_name || E',\n\n' ||
    'A fine of £' || NEW.amount || ' has been issued for ' || v_student_record.first_name || ' ' || v_student_record.last_name || E'.\n\n' ||
    'Reason: ' || NEW.reason || E'\n\n' ||
    'Date: ' || TO_CHAR(NEW.issue_date, 'DD Mon YYYY') || E'\n\n' ||
    'Please arrange payment at your earliest convenience.' || E'\n\n' ||
    'JazakAllah Khair,' || E'\n' ||
    'Al Hikma Institute Crawley',
    'fine',
    NEW.id
  ) INTO v_notification_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fine_issued
  AFTER INSERT ON fines
  FOR EACH ROW
  EXECUTE FUNCTION notify_fine_issued();

-- =====================================================
-- TRIGGER 2: Certificate Issued Alert
-- When a certificate is generated, notify parent
-- =====================================================

CREATE OR REPLACE FUNCTION notify_certificate_issued()
RETURNS TRIGGER AS $$
DECLARE
  v_student_record RECORD;
  v_notification_id UUID;
  v_cert_type_label TEXT;
BEGIN
  -- Get student details
  SELECT id, first_name, last_name, parent_name
  INTO v_student_record
  FROM students
  WHERE id = NEW.student_id;

  -- Format certificate type
  v_cert_type_label := CASE NEW.certificate_type
    WHEN 'subject_completion' THEN 'Subject Completion'
    WHEN 'memorization_completion' THEN 'Memorization Completion'
    WHEN 'academic_excellence' THEN 'Academic Excellence'
    WHEN 'year_completion' THEN 'Year Completion'
    ELSE 'Achievement'
  END;

  -- Create notification for parent
  SELECT create_parent_notification(
    NEW.student_id,
    'certificate',
    'normal',
    '🎓 Certificate Awarded - ' || v_student_record.first_name,
    'Assalamu Alaikum ' || v_student_record.parent_name || E',\n\n' ||
    'MashAllah! A certificate has been awarded to ' || v_student_record.first_name || ' ' || v_student_record.last_name || E'.\n\n' ||
    'Certificate: ' || v_cert_type_label || E'\n' ||
    'Certificate Number: ' || NEW.certificate_number || E'\n' ||
    'Issue Date: ' || TO_CHAR(NEW.issue_date, 'DD Mon YYYY') || E'\n\n' ||
    'You can view and download the certificate from your parent portal.' || E'\n\n' ||
    'Congratulations!' || E'\n' ||
    'JazakAllah Khair,' || E'\n' ||
    'Al Hikma Institute Crawley',
    'certificate',
    NEW.id
  ) INTO v_notification_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_certificate_issued
  AFTER INSERT ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION notify_certificate_issued();

-- =====================================================
-- FUNCTION: Check Consecutive Absences
-- Call this daily or after attendance marking
-- =====================================================

CREATE OR REPLACE FUNCTION check_consecutive_absences()
RETURNS void AS $$
DECLARE
  v_student RECORD;
  v_consecutive_count INTEGER;
  v_last_two_dates DATE[];
  v_notification_id UUID;
  v_existing_notification UUID;
BEGIN
  -- Loop through all active students
  FOR v_student IN 
    SELECT id, first_name, last_name, parent_name, class_id
    FROM students 
    WHERE status = 'active'
  LOOP
    -- Get last 2 attendance records
    SELECT ARRAY_AGG(date ORDER BY date DESC)
    INTO v_last_two_dates
    FROM (
      SELECT date, status
      FROM attendance
      WHERE student_id = v_student.id
      AND status = 'absent'
      ORDER BY date DESC
      LIMIT 2
    ) sub;

    -- Check if we have 2 consecutive absences
    IF array_length(v_last_two_dates, 1) = 2 THEN
      -- Check if dates are consecutive (within 7 days for weekly classes)
      IF (v_last_two_dates[1] - v_last_two_dates[2]) <= 7 THEN
        
        -- Check if we already sent this notification recently (within 7 days)
        SELECT id INTO v_existing_notification
        FROM parent_notifications
        WHERE student_id = v_student.id
        AND type = 'attendance'
        AND title LIKE '%Consecutive Absences%'
        AND created_at > NOW() - INTERVAL '7 days'
        LIMIT 1;

        -- Only create notification if we haven't sent one recently
        IF v_existing_notification IS NULL THEN
          SELECT create_parent_notification(
            v_student.id,
            'attendance',
            'urgent',
            '⚠️ Consecutive Absences - ' || v_student.first_name,
            'Assalamu Alaikum ' || v_student.parent_name || E',\n\n' ||
            v_student.first_name || ' ' || v_student.last_name || ' has been absent for 2 consecutive classes.' || E'\n\n' ||
            'Last absence dates:' || E'\n' ||
            '• ' || TO_CHAR(v_last_two_dates[1], 'DD Mon YYYY') || E'\n' ||
            '• ' || TO_CHAR(v_last_two_dates[2], 'DD Mon YYYY') || E'\n\n' ||
            'If your child is unwell or facing any issues, please let us know.' || E'\n\n' ||
            'JazakAllah Khair,' || E'\n' ||
            'Al Hikma Institute Crawley',
            NULL,
            NULL
          ) INTO v_notification_id;
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Check Upcoming Fee Dues
-- Call this daily to check fees due in 3 days
-- =====================================================

CREATE OR REPLACE FUNCTION check_upcoming_fee_dues()
RETURNS void AS $$
DECLARE
  v_invoice RECORD;
  v_student_record RECORD;
  v_notification_id UUID;
  v_existing_notification UUID;
  v_days_until_due INTEGER;
BEGIN
  -- Find all unpaid invoices due within 3 days
  FOR v_invoice IN
    SELECT 
      fi.id,
      fi.student_id,
      fi.invoice_number,
      fi.total_amount,
      fi.due_date,
      fi.status
    FROM fee_invoices fi
    WHERE fi.status = 'pending'
    AND fi.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
  LOOP
    -- Get student details
    SELECT id, first_name, last_name, parent_name
    INTO v_student_record
    FROM students
    WHERE id = v_invoice.student_id;

    -- Calculate days until due
    v_days_until_due := v_invoice.due_date - CURRENT_DATE;

    -- Check if we already sent notification for this invoice
    SELECT id INTO v_existing_notification
    FROM parent_notifications
    WHERE student_id = v_invoice.student_id
    AND type = 'fee_alert'
    AND link_id = v_invoice.id
    AND created_at > NOW() - INTERVAL '24 hours'
    LIMIT 1;

    -- Only create notification if we haven't sent one in last 24 hours
    IF v_existing_notification IS NULL THEN
      SELECT create_parent_notification(
        v_invoice.student_id,
        'fee_alert',
        CASE WHEN v_days_until_due <= 1 THEN 'urgent' ELSE 'normal' END,
        '💷 Fee Payment Due - ' || v_student_record.first_name,
        'Assalamu Alaikum ' || v_student_record.parent_name || E',\n\n' ||
        'This is a reminder that a fee payment is due for ' || v_student_record.first_name || ' ' || v_student_record.last_name || E'.\n\n' ||
        'Invoice: ' || v_invoice.invoice_number || E'\n' ||
        'Amount: £' || v_invoice.total_amount || E'\n' ||
        'Due Date: ' || TO_CHAR(v_invoice.due_date, 'DD Mon YYYY') || ' (' || v_days_until_due || ' day' || 
        CASE WHEN v_days_until_due != 1 THEN 's' ELSE '' END || ' remaining)' || E'\n\n' ||
        'You can view and pay the invoice through your parent portal.' || E'\n\n' ||
        'JazakAllah Khair,' || E'\n' ||
        'Al Hikma Institute Crawley',
        'fee_invoice',
        v_invoice.id
      ) INTO v_notification_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION: Check Overdue Fees
-- Call this daily to check overdue fees
-- =====================================================

CREATE OR REPLACE FUNCTION check_overdue_fees()
RETURNS void AS $$
DECLARE
  v_invoice RECORD;
  v_student_record RECORD;
  v_notification_id UUID;
  v_existing_notification UUID;
BEGIN
  -- Find all overdue invoices
  FOR v_invoice IN
    SELECT 
      fi.id,
      fi.student_id,
      fi.invoice_number,
      fi.total_amount,
      fi.due_date,
      fi.status
    FROM fee_invoices fi
    WHERE fi.status = 'pending'
    AND fi.due_date < CURRENT_DATE
  LOOP
    -- Get student details
    SELECT id, first_name, last_name, parent_name
    INTO v_student_record
    FROM students
    WHERE id = v_invoice.student_id;

    -- Check if we already sent overdue notification for this invoice in last 7 days
    SELECT id INTO v_existing_notification
    FROM parent_notifications
    WHERE student_id = v_invoice.student_id
    AND type = 'fee_alert'
    AND priority = 'urgent'
    AND link_id = v_invoice.id
    AND created_at > NOW() - INTERVAL '7 days'
    LIMIT 1;

    -- Only create notification if we haven't sent one in last 7 days
    IF v_existing_notification IS NULL THEN
      SELECT create_parent_notification(
        v_invoice.student_id,
        'fee_alert',
        'urgent',
        '🔴 URGENT: Overdue Fee Payment - ' || v_student_record.first_name,
        'Assalamu Alaikum ' || v_student_record.parent_name || E',\n\n' ||
        'A fee payment is now OVERDUE for ' || v_student_record.first_name || ' ' || v_student_record.last_name || E'.\n\n' ||
        'Invoice: ' || v_invoice.invoice_number || E'\n' ||
        'Amount: £' || v_invoice.total_amount || E'\n' ||
        'Due Date: ' || TO_CHAR(v_invoice.due_date, 'DD Mon YYYY') || E'\n' ||
        'Days Overdue: ' || (CURRENT_DATE - v_invoice.due_date) || E'\n\n' ||
        'Please arrange payment urgently to avoid any disruption.' || E'\n\n' ||
        'You can view and pay the invoice through your parent portal.' || E'\n\n' ||
        'If you need to discuss payment arrangements, please contact us.' || E'\n\n' ||
        'JazakAllah Khair,' || E'\n' ||
        'Al Hikma Institute Crawley',
        'fee_invoice',
        v_invoice.id
      ) INTO v_notification_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON FUNCTION notify_fine_issued IS 'Automatically creates urgent notification when fine is issued';
COMMENT ON FUNCTION notify_certificate_issued IS 'Automatically creates notification when certificate is awarded';
COMMENT ON FUNCTION check_consecutive_absences IS 'Check for students with 2+ consecutive absences and notify parents';
COMMENT ON FUNCTION check_upcoming_fee_dues IS 'Check for fees due within 3 days and send reminders';
COMMENT ON FUNCTION check_overdue_fees IS 'Check for overdue fees and send urgent reminders';