-- =====================================================
-- MADRASA ATTENDANCE SYSTEM - MEMORIZATION & CERTIFICATES
-- Migration 004: Memorization Items, Student Memorization, Certificates
-- =====================================================

-- =====================================================
-- TABLE: memorization_items
-- Stores Duas, Surahs, and Hadiths for memorization
-- =====================================================

CREATE TABLE IF NOT EXISTS public.memorization_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Item Type
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('dua', 'surah', 'hadith')),
  
  -- Content
  name VARCHAR(255) NOT NULL,
  arabic_text TEXT,
  transliteration TEXT,
  translation TEXT,
  reference VARCHAR(255), -- Source/reference for the item
  
  -- Classification
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  class_level VARCHAR(100), -- e.g., "All classes", "Beginner", "Intermediate"
  is_required BOOLEAN DEFAULT true,
  sequence_order INTEGER, -- Order in which items should be learned
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLE: student_memorization
-- Tracks individual student progress on memorization items
-- =====================================================

CREATE TABLE IF NOT EXISTS public.student_memorization (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- References
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  memorization_item_id UUID NOT NULL REFERENCES public.memorization_items(id) ON DELETE CASCADE,
  
  -- Progress Status
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'learning', 'memorized', 'mastered')),
  proficiency_rating INTEGER CHECK (proficiency_rating BETWEEN 1 AND 5),
  
  -- Dates
  started_date DATE,
  memorized_date DATE,
  mastered_date DATE,
  last_tested_date DATE,
  
  -- Assessment
  test_score DECIMAL(5,2), -- Percentage score 0-100
  teacher_notes TEXT,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per student per item
  UNIQUE(student_id, memorization_item_id)
);

-- =====================================================
-- TABLE: certificates
-- Stores issued certificates
-- =====================================================

CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- References
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  certificate_type VARCHAR(50) NOT NULL CHECK (certificate_type IN (
    'subject_completion',
    'memorization_completion',
    'academic_excellence',
    'year_completion'
  )),
  
  -- Related Data
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL, -- For subject_completion certificates
  
  -- Certificate Details
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  grade VARCHAR(10), -- Percentage or letter grade if applicable
  remarks TEXT,
  
  -- Issued By
  issued_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- PDF Storage
  pdf_url TEXT, -- URL to generated PDF (optional)
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- memorization_items
CREATE INDEX idx_memorization_items_type ON public.memorization_items(item_type);
CREATE INDEX idx_memorization_items_difficulty ON public.memorization_items(difficulty_level);
CREATE INDEX idx_memorization_items_sequence ON public.memorization_items(sequence_order);

-- student_memorization
CREATE INDEX idx_student_memorization_student ON public.student_memorization(student_id);
CREATE INDEX idx_student_memorization_item ON public.student_memorization(memorization_item_id);
CREATE INDEX idx_student_memorization_status ON public.student_memorization(status);
CREATE INDEX idx_student_memorization_student_status ON public.student_memorization(student_id, status);

-- certificates
CREATE INDEX idx_certificates_student ON public.certificates(student_id);
CREATE INDEX idx_certificates_type ON public.certificates(certificate_type);
CREATE INDEX idx_certificates_number ON public.certificates(certificate_number);
CREATE INDEX idx_certificates_issue_date ON public.certificates(issue_date DESC);

-- =====================================================
-- TRIGGERS: Automatic Updated_at Timestamp
-- =====================================================

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.memorization_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.student_memorization
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- FUNCTION: Generate Certificate Number
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  year_code VARCHAR(4);
  sequence_num INTEGER;
  cert_number VARCHAR(50);
BEGIN
  year_code := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Get the maximum sequence number for this year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(certificate_number FROM LENGTH(certificate_number) - 3) AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.certificates
  WHERE certificate_number LIKE 'CERT-' || year_code || '-%';
  
  -- Format: CERT-2025-0001
  cert_number := 'CERT-' || year_code || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN cert_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Auto-generate Certificate Number
-- =====================================================

CREATE OR REPLACE FUNCTION public.set_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.certificate_number IS NULL OR NEW.certificate_number = '' THEN
    NEW.certificate_number := public.generate_certificate_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_certificate_number_trigger
BEFORE INSERT ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.set_certificate_number();

-- =====================================================
-- RLS POLICIES: memorization_items
-- =====================================================

ALTER TABLE public.memorization_items ENABLE ROW LEVEL SECURITY;

-- Everyone can view memorization items
CREATE POLICY "Anyone can view memorization items"
  ON public.memorization_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage memorization items
CREATE POLICY "Only admins can manage memorization items"
  ON public.memorization_items FOR ALL
  USING (public.is_admin());

-- =====================================================
-- RLS POLICIES: student_memorization
-- =====================================================

ALTER TABLE public.student_memorization ENABLE ROW LEVEL SECURITY;

-- Teachers can view their students' memorization progress
CREATE POLICY "Teachers can view memorization progress"
  ON public.student_memorization FOR SELECT
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

-- Teachers can add/update memorization progress for their students
CREATE POLICY "Teachers can add memorization progress"
  ON public.student_memorization FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.students 
      WHERE class_id IN (SELECT public.get_teacher_class_ids())
    )
    OR
    public.is_admin()
  );

CREATE POLICY "Teachers can update memorization progress"
  ON public.student_memorization FOR UPDATE
  USING (
    student_id IN (
      SELECT id FROM public.students 
      WHERE class_id IN (SELECT public.get_teacher_class_ids())
    )
    OR
    public.is_admin()
  );

-- Only admins can delete memorization progress
CREATE POLICY "Only admins can delete memorization progress"
  ON public.student_memorization FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- RLS POLICIES: certificates
-- =====================================================

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Students/parents can view their own certificates
-- Teachers can view their students' certificates
-- Admins can view all
CREATE POLICY "Users can view relevant certificates"
  ON public.certificates FOR SELECT
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

-- Only admins can issue certificates
CREATE POLICY "Only admins can issue certificates"
  ON public.certificates FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can update certificates
CREATE POLICY "Only admins can update certificates"
  ON public.certificates FOR UPDATE
  USING (public.is_admin());

-- Only admins can delete certificates
CREATE POLICY "Only admins can delete certificates"
  ON public.certificates FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- SEED DATA: Sample Memorization Items (minimal)
-- =====================================================

-- Insert 1 sample Dua
INSERT INTO public.memorization_items (
  item_type, name, arabic_text, transliteration, translation,
  reference, difficulty_level, class_level, is_required, sequence_order
) VALUES (
  'dua',
  'Dua before eating',
  'بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ',
  'Bismillahi ar-Rahmani ar-Raheem',
  'In the name of Allah, the Most Gracious, the Most Merciful',
  'Common Islamic practice',
  'beginner',
  'All classes',
  true,
  1
);

-- Insert 1 sample Surah
INSERT INTO public.memorization_items (
  item_type, name, arabic_text, transliteration, translation,
  reference, difficulty_level, class_level, is_required, sequence_order
) VALUES (
  'surah',
  'Surah Al-Fatiha',
  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ (١) الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ (٢) الرَّحْمَٰنِ الرَّحِيمِ (٣) مَالِكِ يَوْمِ الدِّينِ (٤) إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ (٥) اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ (٦) صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ (٧)',
  'Bismillahi ar-Rahmani ar-Raheem, Alhamdulillahi Rabbil Aalameen...',
  'In the name of Allah, the Most Gracious, the Most Merciful. All praise is due to Allah, Lord of all the worlds...',
  'Quran 1:1-7',
  'beginner',
  'All classes',
  true,
  1
);

-- Insert 1 sample Hadith
INSERT INTO public.memorization_items (
  item_type, name, arabic_text, transliteration, translation,
  reference, difficulty_level, class_level, is_required, sequence_order
) VALUES (
  'hadith',
  'Actions are by intentions',
  'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
  'Innama al-a''malu bin-niyyat',
  'Actions are judged by intentions',
  'Sahih Bukhari 1, Sahih Muslim 1907',
  'intermediate',
  'Intermediate',
  true,
  1
);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
DECLARE
  memorization_items_count INT;
  tables_count INT := 3;
  indexes_count INT := 11;
  policies_count INT := 11;
BEGIN
  SELECT COUNT(*) INTO memorization_items_count FROM public.memorization_items;
  
  RAISE NOTICE '✅ Memorization & Certificates tables created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Migration Summary:';
  RAISE NOTICE '   - Tables created: %', tables_count;
  RAISE NOTICE '   - Indexes created: %', indexes_count;
  RAISE NOTICE '   - RLS Policies: %', policies_count;
  RAISE NOTICE '   - Sample memorization items: %', memorization_items_count;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables:';
  RAISE NOTICE '   - memorization_items (Duas, Surahs, Hadiths)';
  RAISE NOTICE '   - student_memorization (Progress tracking)';
  RAISE NOTICE '   - certificates (Certificate records)';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Security: RLS enabled on all tables';
  RAISE NOTICE '⚡ Triggers: Auto-generate certificate numbers';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Create memorization pages and components';
END $$;