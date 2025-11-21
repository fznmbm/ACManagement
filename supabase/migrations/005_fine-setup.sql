-- Fine Management System Migration
-- Add this to your Supabase SQL editor

-- 1. Create fines table
CREATE TABLE IF NOT EXISTS fines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  attendance_record_id uuid NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  fine_type text NOT NULL CHECK (fine_type IN ('late', 'absent')),
  amount decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived')),
  issued_date date NOT NULL DEFAULT CURRENT_DATE,
  paid_date date,
  collected_by uuid REFERENCES profiles(id),
  payment_method text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create fine settings table
CREATE TABLE IF NOT EXISTS fine_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fine_type text NOT NULL CHECK (fine_type IN ('late', 'absent')),
  amount decimal(10,2) NOT NULL,
  is_active boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(fine_type)
);

-- 3. Insert default fine amounts
INSERT INTO fine_settings (fine_type, amount, description) VALUES 
  ('late', 2.00, 'Fine for arriving late to class'),
  ('absent', 5.00, 'Fine for missing class without excuse')
ON CONFLICT (fine_type) DO NOTHING;

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fines_student_id ON fines(student_id);
CREATE INDEX IF NOT EXISTS idx_fines_status ON fines(status);
CREATE INDEX IF NOT EXISTS idx_fines_issued_date ON fines(issued_date);
CREATE INDEX IF NOT EXISTS idx_fines_attendance_record ON fines(attendance_record_id);

-- 5. Add RLS policies
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE fine_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view and manage fines
CREATE POLICY "Users can view fines" ON fines 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Teachers and admins can manage fines" ON fines 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'teacher')
    )
  );

-- Fine settings policies
CREATE POLICY "Users can view fine settings" ON fine_settings 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage fine settings" ON fine_settings 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- 6. Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fines_updated_at 
  BEFORE UPDATE ON fines 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fine_settings_updated_at 
  BEFORE UPDATE ON fine_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Create function to automatically generate fines
CREATE OR REPLACE FUNCTION auto_generate_fine()
RETURNS TRIGGER AS $$
DECLARE
  fine_amount decimal(10,2);
BEGIN
  -- Only create fine for late or absent status
  IF NEW.status IN ('late', 'absent') THEN
    -- Get the fine amount from settings
    SELECT amount INTO fine_amount 
    FROM fine_settings 
    WHERE fine_type = NEW.status AND is_active = true;
    
    -- Insert fine record if amount is found
    IF fine_amount IS NOT NULL THEN
      INSERT INTO fines (
        student_id,
        attendance_record_id,
        fine_type,
        amount,
        status,
        issued_date
      ) VALUES (
        NEW.student_id,
        NEW.id,
        NEW.status,
        fine_amount,
        'pending',
        NEW.date
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create trigger to auto-generate fines on attendance marking
CREATE TRIGGER trigger_auto_generate_fine
  AFTER INSERT OR UPDATE ON attendance
  FOR EACH ROW 
  WHEN (NEW.status IN ('late', 'absent'))
  EXECUTE FUNCTION auto_generate_fine();

-- 9. Create view for fine summary by student
CREATE OR REPLACE VIEW student_fine_summary AS
SELECT 
  s.id as student_id,
  s.first_name,
  s.last_name,
  s.student_number,
  COUNT(f.id) as total_fines,
  COUNT(f.id) FILTER (WHERE f.status = 'pending') as pending_fines,
  COUNT(f.id) FILTER (WHERE f.status = 'paid') as paid_fines,
  COALESCE(SUM(f.amount) FILTER (WHERE f.status = 'pending'), 0) as pending_amount,
  COALESCE(SUM(f.amount) FILTER (WHERE f.status = 'paid'), 0) as paid_amount,
  COALESCE(SUM(f.amount), 0) as total_amount
FROM students s
LEFT JOIN fines f ON s.id = f.student_id
GROUP BY s.id, s.first_name, s.last_name, s.student_number;