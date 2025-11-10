-- =====================================================
-- MADRASA ATTENDANCE SYSTEM - SEED DATA (FIXED)
-- Migration 003: Sample Data for Testing
-- =====================================================

-- =====================================================
-- INSERT SUBJECTS
-- =====================================================

INSERT INTO public.subjects (name, name_arabic, description, subject_type, is_active) VALUES
('Quran Memorization', 'حفظ القرآن', 'Memorization and recitation of the Holy Quran', 'Quran', true),
('Islamic Studies', 'الدراسات الإسلامية', 'Basic Islamic knowledge and teachings', 'Islamic Studies', true),
('Arabic Language', 'اللغة العربية', 'Arabic language learning and grammar', 'Arabic', true),
('Fiqh', 'الفقه', 'Islamic jurisprudence and rulings', 'Fiqh', true),
('Hadith', 'الحديث', 'Study of Prophet Muhammad (PBUH) sayings', 'Hadith', true),
('Tajweed', 'التجويد', 'Rules of Quran recitation', 'Quran', true);

-- =====================================================
-- INSERT SYSTEM SETTINGS
-- =====================================================

INSERT INTO public.system_settings (setting_key, setting_value, description, category, is_public) VALUES
('academic_year', '{"current": "2024-2025", "start_date": "2024-09-01", "end_date": "2025-06-30"}', 'Current academic year', 'general', true),
('attendance_cutoff_time', '{"regular": "09:00", "grace_period_minutes": 15}', 'Time after which students are marked late', 'academic', false),
('notification_enabled', '{"email": true, "sms": false, "telegram": false}', 'Enabled notification channels', 'notification', false),
('low_attendance_threshold', '{"percentage": 75, "alert_admin": true}', 'Threshold for low attendance alerts', 'academic', false),
('centre_info', '{"name": "Al-Noor Islamic Centre", "address": "123 Main Street", "phone": "+44 20 1234 5678", "email": "info@alnoor.org"}', 'Centre contact information', 'general', true),
('prayer_times', '{"fajr": "05:30", "dhuhr": "13:00", "asr": "16:30", "maghrib": "19:00", "isha": "20:30"}', 'Daily prayer times (approximate)', 'general', true);

-- =====================================================
-- INSERT CLASSES
-- =====================================================

INSERT INTO public.classes (name, description, level, capacity, academic_year, schedule, is_active) VALUES
(
  'Quran Beginners - Morning',
  'Introduction to Quran recitation and basic Surahs',
  'Beginner',
  20,
  '2024-2025',
  '{"days": ["Monday", "Wednesday", "Friday"], "time": "09:00-11:00", "room": "Room A"}'::jsonb,
  true
),
(
  'Quran Intermediate - Afternoon',
  'Tajweed and longer Surahs memorization',
  'Intermediate',
  15,
  '2024-2025',
  '{"days": ["Tuesday", "Thursday", "Saturday"], "time": "14:00-16:00", "room": "Room B"}'::jsonb,
  true
),
(
  'Islamic Studies - Weekend',
  'Comprehensive Islamic education for youth',
  'Mixed',
  25,
  '2024-2025',
  '{"days": ["Saturday", "Sunday"], "time": "10:00-13:00", "room": "Hall 1"}'::jsonb,
  true
);

-- =====================================================
-- INSERT STUDENTS
-- =====================================================

-- Class 1: Quran Beginners (5 students)
INSERT INTO public.students (
  first_name, last_name, arabic_name, date_of_birth, gender,
  parent_name, parent_email, parent_phone, parent_phone_secondary,
  address, city, postal_code,
  class_id, enrollment_date, status
) VALUES
(
  'Ali', 'Ahmed', 'علي أحمد', '2014-03-15', 'male',
  'Mohammed Ahmed', 'mohammed.ahmed@email.com', '+44 7700 900001', NULL,
  '10 Park Road', 'London', 'E1 4NS',
  (SELECT id FROM public.classes WHERE name = 'Quran Beginners - Morning' LIMIT 1),
  '2024-09-01', 'active'
),
(
  'Aisha', 'Hassan', 'عائشة حسان', '2013-07-22', 'female',
  'Fatima Hassan', 'fatima.hassan@email.com', '+44 7700 900002', NULL,
  '25 Oak Avenue', 'London', 'E2 8HQ',
  (SELECT id FROM public.classes WHERE name = 'Quran Beginners - Morning' LIMIT 1),
  '2024-09-01', 'active'
),
(
  'Omar', 'Ibrahim', 'عمر إبراهيم', '2014-11-08', 'male',
  'Khalid Ibrahim', 'khalid.ibrahim@email.com', '+44 7700 900003', '+44 7700 900033',
  '42 High Street', 'London', 'E3 2ND',
  (SELECT id FROM public.classes WHERE name = 'Quran Beginners - Morning' LIMIT 1),
  '2024-09-01', 'active'
),
(
  'Mariam', 'Abdullah', 'مريم عبدالله', '2013-12-30', 'female',
  'Amina Abdullah', 'amina.abdullah@email.com', '+44 7700 900004', NULL,
  '18 Green Lane', 'London', 'E4 7JH',
  (SELECT id FROM public.classes WHERE name = 'Quran Beginners - Morning' LIMIT 1),
  '2024-09-01', 'active'
),
(
  'Yusuf', 'Khan', 'يوسف خان', '2014-05-19', 'male',
  'Imran Khan', 'imran.khan@email.com', '+44 7700 900005', NULL,
  '7 Station Road', 'London', 'E5 0PL',
  (SELECT id FROM public.classes WHERE name = 'Quran Beginners - Morning' LIMIT 1),
  '2024-09-01', 'active'
);

-- Class 2: Quran Intermediate (5 students)
INSERT INTO public.students (
  first_name, last_name, arabic_name, date_of_birth, gender,
  parent_name, parent_email, parent_phone,
  address, city, postal_code,
  class_id, enrollment_date, status
) VALUES
(
  'Bilal', 'Mahmood', 'بلال محمود', '2012-02-14', 'male',
  'Tariq Mahmood', 'tariq.mahmood@email.com', '+44 7700 900006',
  '33 Church Street', 'London', 'E6 1AB',
  (SELECT id FROM public.classes WHERE name = 'Quran Intermediate - Afternoon' LIMIT 1),
  '2024-09-01', 'active'
),
(
  'Zainab', 'Ali', 'زينب علي', '2011-09-25', 'female',
  'Sara Ali', 'sara.ali@email.com', '+44 7700 900007',
  '56 Mill Lane', 'London', 'E7 9RP',
  (SELECT id FROM public.classes WHERE name = 'Quran Intermediate - Afternoon' LIMIT 1),
  '2024-09-01', 'active'
),
(
  'Hassan', 'Malik', 'حسن مالك', '2012-06-10', 'male',
  'Usman Malik', 'usman.malik@email.com', '+44 7700 900008',
  '91 Bridge Road', 'London', 'E8 4QJ',
  (SELECT id FROM public.classes WHERE name = 'Quran Intermediate - Afternoon' LIMIT 1),
  '2024-09-01', 'active'
),
(
  'Hafsa', 'Rahman', 'حفصة رحمان', '2011-11-03', 'female',
  'Nadia Rahman', 'nadia.rahman@email.com', '+44 7700 900009',
  '14 Market Street', 'London', 'E9 5SJ',
  (SELECT id FROM public.classes WHERE name = 'Quran Intermediate - Afternoon' LIMIT 1),
  '2024-09-01', 'active'
),
(
  'Ibrahim', 'Siddique', 'إبراهيم صديق', '2012-08-17', 'male',
  'Ahmed Siddique', 'ahmed.siddique@email.com', '+44 7700 900010',
  '28 Victoria Road', 'London', 'E10 7NW',
  (SELECT id FROM public.classes WHERE name = 'Quran Intermediate - Afternoon' LIMIT 1),
  '2024-09-01', 'active'
);

-- Class 3: Islamic Studies (5 students)
INSERT INTO public.students (
  first_name, last_name, arabic_name, date_of_birth, gender,
  parent_name, parent_email, parent_phone,
  address, city, postal_code,
  class_id, enrollment_date, status
) VALUES
(
  'Zakariya', 'Hussain', 'زكريا حسين', '2010-04-20', 'male',
  'Rashid Hussain', 'rashid.hussain@email.com', '+44 7700 900011',
  '73 Forest Road', 'London', 'E11 1LN',
  (SELECT id FROM public.classes WHERE name = 'Islamic Studies - Weekend' LIMIT 1),
  '2024-09-01', 'active'
),
(
  'Khadija', 'Farooq', 'خديجة فاروق', '2010-01-12', 'female',
  'Yasmin Farooq', 'yasmin.farooq@email.com', '+44 7700 900012',
  '45 Garden Walk', 'London', 'E12 6TL',
  (SELECT id FROM public.classes WHERE name = 'Islamic Studies - Weekend' LIMIT 1),
  '2024-09-01', 'active'
),
(
  'Sulaiman', 'Iqbal', 'سليمان إقبال', '2011-07-05', 'male',
  'Farhan Iqbal', 'farhan.iqbal@email.com', '+44 7700 900013',
  '62 Hill Crescent', 'London', 'E13 8FD',
  (SELECT id FROM public.classes WHERE name = 'Islamic Studies - Weekend' LIMIT 1),
  '2024-09-01', 'active'
),
(
  'Ruqayyah', 'Yusuf', 'رقية يوسف', '2010-10-28', 'female',
  'Haleema Yusuf', 'haleema.yusuf@email.com', '+44 7700 900014',
  '19 River Street', 'London', 'E14 3PQ',
  (SELECT id FROM public.classes WHERE name = 'Islamic Studies - Weekend' LIMIT 1),
  '2024-09-01', 'active'
),
(
  'Hamza', 'Sheikh', 'حمزة شيخ', '2011-03-16', 'male',
  'Bilal Sheikh', 'bilal.sheikh@email.com', '+44 7700 900015',
  '88 Tower Lane', 'London', 'E15 2BH',
  (SELECT id FROM public.classes WHERE name = 'Islamic Studies - Weekend' LIMIT 1),
  '2024-09-01', 'active'
);

-- =====================================================
-- INSERT SAMPLE ATTENDANCE RECORDS (Last 7 days)
-- FIXED: Proper TIME casting
-- =====================================================

DO $$
DECLARE
  student_record RECORD;
  day_offset INT;
  attendance_date DATE;
  random_status VARCHAR(20);
  arrival_time_value TIME;
BEGIN
  -- Loop through first 5 students
  FOR student_record IN 
    SELECT id, class_id FROM public.students LIMIT 5
  LOOP
    -- Create attendance for last 7 days
    FOR day_offset IN 0..6 LOOP
      attendance_date := CURRENT_DATE - day_offset;
      
      -- Randomly assign status (mostly present, some absent/late)
      random_status := CASE 
        WHEN day_offset % 7 = 0 THEN 'absent'
        WHEN day_offset % 5 = 0 THEN 'late'
        ELSE 'present'
      END;
      
      -- Set arrival time with proper casting
      arrival_time_value := CASE random_status
        WHEN 'late' THEN '09:20:00'::TIME
        WHEN 'present' THEN '09:00:00'::TIME
        ELSE NULL
      END;
      
      INSERT INTO public.attendance (
        student_id, 
        class_id, 
        date, 
        status, 
        session_type,
        arrival_time
      ) VALUES (
        student_record.id,
        student_record.class_id,
        attendance_date,
        random_status,
        'regular',
        arrival_time_value
      );
    END LOOP;
  END LOOP;
END $$;

-- =====================================================
-- INSERT SAMPLE QURAN PROGRESS
-- =====================================================

INSERT INTO public.quran_progress (
  student_id, surah_number, surah_name, surah_name_arabic,
  verses_memorized, verses_total, progress_type, proficiency_level,
  teacher_notes, started_date, completed_date
) VALUES
-- Student 1: Ali Ahmed - Completed Al-Fatiha
(
  (SELECT id FROM public.students WHERE first_name = 'Ali' AND last_name = 'Ahmed'),
  1, 'Al-Fatiha', 'الفاتحة',
  7, 7, 'memorization', 'mastered',
  'Excellent progress. Ready for next Surah.',
  '2024-09-05', '2024-09-20'
),
-- Student 1: Ali Ahmed - Working on An-Nas
(
  (SELECT id FROM public.students WHERE first_name = 'Ali' AND last_name = 'Ahmed'),
  114, 'An-Nas', 'الناس',
  4, 6, 'memorization', 'intermediate',
  'Good pronunciation. Needs to complete last 2 verses.',
  '2024-09-21', NULL
),
-- Student 2: Aisha Hassan - Working on Al-Falaq
(
  (SELECT id FROM public.students WHERE first_name = 'Aisha' AND last_name = 'Hassan'),
  113, 'Al-Falaq', 'الفلق',
  3, 5, 'memorization', 'beginner',
  'Making steady progress. Practice recommended.',
  '2024-09-10', NULL
),
-- Student 3: Omar Ibrahim - Completed Al-Ikhlas
(
  (SELECT id FROM public.students WHERE first_name = 'Omar' AND last_name = 'Ibrahim'),
  112, 'Al-Ikhlas', 'الإخلاص',
  4, 4, 'memorization', 'mastered',
  'Perfect recitation with tajweed.',
  '2024-09-01', '2024-09-15'
);

-- =====================================================
-- INSERT SAMPLE ACADEMIC PROGRESS
-- =====================================================

INSERT INTO public.academic_progress (
  student_id, subject_id, assessment_type, assessment_date,
  score, max_score, grade, topic, teacher_feedback
) VALUES
(
  (SELECT id FROM public.students WHERE first_name = 'Ali' AND last_name = 'Ahmed'),
  (SELECT id FROM public.subjects WHERE name = 'Islamic Studies'),
  'quiz', '2024-10-15',
  18, 20, 'A', 'Pillars of Islam',
  'Excellent understanding of the concepts.'
),
(
  (SELECT id FROM public.students WHERE first_name = 'Aisha' AND last_name = 'Hassan'),
  (SELECT id FROM public.subjects WHERE name = 'Arabic Language'),
  'test', '2024-10-20',
  35, 40, 'B+', 'Arabic Alphabets and Pronunciation',
  'Good effort. Keep practicing pronunciation.'
),
(
  (SELECT id FROM public.students WHERE first_name = 'Bilal' AND last_name = 'Mahmood'),
  (SELECT id FROM public.subjects WHERE name = 'Tajweed'),
  'oral', '2024-10-25',
  45, 50, 'A', 'Rules of Noon Sakinah',
  'Excellent application of tajweed rules.'
);

-- =====================================================
-- ASSIGN TEACHERS TO CLASSES
-- =====================================================

-- This will run after you create the auth users
-- For now, we'll leave it commented out

-- UPDATE public.classes 
-- SET teacher_id = (SELECT id FROM public.profiles WHERE email = 'ahmed@madrasa.test')
-- WHERE name = 'Quran Beginners - Morning';

-- UPDATE public.classes 
-- SET teacher_id = (SELECT id FROM public.profiles WHERE email = 'fatima@madrasa.test')
-- WHERE name = 'Quran Intermediate - Afternoon';

-- UPDATE public.classes 
-- SET teacher_id = (SELECT id FROM public.profiles WHERE email = 'ahmed@madrasa.test')
-- WHERE name = 'Islamic Studies - Weekend';

-- =====================================================
-- SUCCESS MESSAGE & INSTRUCTIONS
-- =====================================================

DO $$
DECLARE
  student_count INT;
  class_count INT;
  subject_count INT;
  attendance_count INT;
BEGIN
  SELECT COUNT(*) INTO student_count FROM public.students;
  SELECT COUNT(*) INTO class_count FROM public.classes;
  SELECT COUNT(*) INTO subject_count FROM public.subjects;
  SELECT COUNT(*) INTO attendance_count FROM public.attendance;
  
  RAISE NOTICE '✅ Seed data inserted successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Data Summary:';
  RAISE NOTICE '   - Classes: %', class_count;
  RAISE NOTICE '   - Students: %', student_count;
  RAISE NOTICE '   - Subjects: %', subject_count;
  RAISE NOTICE '   - Attendance records: %', attendance_count;
  RAISE NOTICE '   - Quran progress: 4 records';
  RAISE NOTICE '   - Academic assessments: 3 records';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Create Auth Users Next!';
  RAISE NOTICE '';
  RAISE NOTICE '👉 Go to: Authentication > Users > Add User';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Create these test accounts:';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣  ADMIN ACCOUNT:';
  RAISE NOTICE '   Email: admin@madrasa.test';
  RAISE NOTICE '   Password: Admin123!@#';
  RAISE NOTICE '   Metadata: {"full_name": "Administrator", "role": "super_admin"}';
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣  TEACHER 1:';
  RAISE NOTICE '   Email: ahmed@madrasa.test';
  RAISE NOTICE '   Password: Teacher123!';
  RAISE NOTICE '   Metadata: {"full_name": "Ahmed Ibrahim", "role": "teacher"}';
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣  TEACHER 2:';
  RAISE NOTICE '   Email: fatima@madrasa.test';
  RAISE NOTICE '   Password: Teacher123!';
  RAISE NOTICE '   Metadata: {"full_name": "Fatima Hassan", "role": "teacher"}';
  RAISE NOTICE '';
  RAISE NOTICE '✨ After creating users, run the teacher assignment SQL!';
END $$;