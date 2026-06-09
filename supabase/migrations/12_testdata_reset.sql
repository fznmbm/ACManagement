-- ================================================
-- ACManagement Test Data Reset Script
-- Preserves: profiles, classes, system_settings, 
--            subjects, memorization_items, 
--            fee_structures, fee_quarter_settings,
--            application_settings
-- Deletes: all student data and transactions
-- ================================================

-- Disable triggers temporarily to avoid cascade issues
SET session_replication_role = replica;

-- 1. Clear alert/event system
DELETE FROM student_events;
DELETE FROM message_delivery_log;

-- 2. Clear prayer sheets
DELETE FROM prayer_sheets;

-- 3. Clear fines and fees (keep structures)
DELETE FROM fines;
DELETE FROM fee_payments;
DELETE FROM fee_invoices;
DELETE FROM student_fee_assignments;

-- 4. Clear attendance
DELETE FROM attendance;

-- 5. Clear academic data
DELETE FROM academic_progress;
DELETE FROM student_memorization;
DELETE FROM certificates;
DELETE FROM student_feedback;        -- ADD THIS
DELETE FROM class_feedback_sessions; -- ADD THIS

-- 6. Clear parent links and notifications
DELETE FROM parent_student_links;
DELETE FROM parent_notifications;
DELETE FROM parent_notification_preferences;

-- 7. Clear applications
DELETE FROM applications;

-- 8. Clear messages and logs
DELETE FROM messages;

-- 9. Clear events and RSVPs
DELETE FROM event_rsvps;
DELETE FROM events;

-- 10. Clear students (last, after all dependencies)
DELETE FROM students;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Reset application count to 0
UPDATE application_settings SET current_applications_count = 0;

-- Verify what's left
SELECT 'profiles' as table_name, COUNT(*) as remaining FROM profiles
UNION ALL SELECT 'classes', COUNT(*) FROM classes
UNION ALL SELECT 'system_settings', COUNT(*) FROM system_settings
UNION ALL SELECT 'memorization_items', COUNT(*) FROM memorization_items
UNION ALL SELECT 'fee_structures', COUNT(*) FROM fee_structures
UNION ALL SELECT 'fee_quarter_settings', COUNT(*) FROM fee_quarter_settings
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL SELECT 'fines', COUNT(*) FROM fines
UNION ALL SELECT 'prayer_sheets', COUNT(*) FROM prayer_sheets
UNION ALL SELECT 'student_events', COUNT(*) FROM student_events
UNION ALL SELECT 'applications', COUNT(*) FROM applications;