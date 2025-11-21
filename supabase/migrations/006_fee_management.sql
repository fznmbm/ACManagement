-- Fee Management System Database Migration

-- 1. Fee structures table (define different fee types)
CREATE TABLE IF NOT EXISTS fee_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount decimal(10,2) NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'annually', 'one_time')),
  description text,
  is_active boolean DEFAULT true,
  due_day integer DEFAULT 1 CHECK (due_day >= 1 AND due_day <= 28),
  grace_period_days integer DEFAULT 7,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Student fee assignments (which students pay which fees)
CREATE TABLE IF NOT EXISTS student_fee_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_structure_id uuid NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  is_active boolean DEFAULT true,
  assigned_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, fee_structure_id)
);

-- 3. Fee invoices (generated bills)
CREATE TABLE IF NOT EXISTS fee_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  fee_structure_id uuid NOT NULL REFERENCES fee_structures(id),
  period_start date NOT NULL,
  period_end date NOT NULL,
  due_date date NOT NULL,
  amount_due decimal(10,2) NOT NULL,
  amount_paid decimal(10,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  generated_date date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Fee payments (payment records)
CREATE TABLE IF NOT EXISTS fee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES fee_invoices(id) ON DELETE CASCADE,
  payment_reference text,
  amount decimal(10,2) NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'cheque', 'online')),
  collected_by uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_student_id ON student_fee_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_fee_structure_id ON student_fee_assignments(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_student_id ON fee_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_status ON fee_invoices(status);
CREATE INDEX IF NOT EXISTS idx_fee_invoices_due_date ON fee_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_fee_payments_invoice_id ON fee_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_payment_date ON fee_payments(payment_date);

-- 6. Enable RLS
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
CREATE POLICY "Users can view fee structures" ON fee_structures FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage fee structures" ON fee_structures FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Users can view student fee assignments" ON student_fee_assignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage student fee assignments" ON student_fee_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Users can view fee invoices" ON fee_invoices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage fee invoices" ON fee_invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

CREATE POLICY "Users can view fee payments" ON fee_payments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can manage fee payments" ON fee_payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'teacher'))
);

-- 8. Update triggers
CREATE TRIGGER update_fee_structures_updated_at BEFORE UPDATE ON fee_structures 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_fee_assignments_updated_at BEFORE UPDATE ON student_fee_assignments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fee_invoices_updated_at BEFORE UPDATE ON fee_invoices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Functions for invoice generation
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year_code text;
  sequence_num integer;
  invoice_num text;
BEGIN
  year_code := EXTRACT(year FROM CURRENT_DATE)::text;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 9) AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM fee_invoices
  WHERE invoice_number LIKE 'INV-' || year_code || '-%';
  
  invoice_num := 'INV-' || year_code || '-' || LPAD(sequence_num::text, 4, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

-- 10. Function to update invoice status based on payments
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid decimal(10,2);
  invoice_amount decimal(10,2);
  current_status text;
BEGIN
  -- Get total paid for the invoice
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM fee_payments 
  WHERE invoice_id = NEW.invoice_id;
  
  -- Get invoice amount
  SELECT amount_due INTO invoice_amount
  FROM fee_invoices 
  WHERE id = NEW.invoice_id;
  
  -- Determine new status
  IF total_paid >= invoice_amount THEN
    current_status := 'paid';
  ELSIF total_paid > 0 THEN
    current_status := 'partial';
  ELSE
    current_status := 'pending';
  END IF;
  
  -- Update invoice
  UPDATE fee_invoices 
  SET 
    amount_paid = total_paid,
    status = current_status
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invoice status updates
CREATE TRIGGER trigger_update_invoice_status
  AFTER INSERT OR UPDATE OR DELETE ON fee_payments
  FOR EACH ROW EXECUTE FUNCTION update_invoice_status();

-- 11. Insert default fee structures
INSERT INTO fee_structures (name, amount, frequency, description) VALUES 
  ('Monthly Tuition Fee', 75.00, 'monthly', 'Standard monthly tuition fee'),
  ('Quarterly Materials Fee', 25.00, 'quarterly', 'Books and learning materials'),
  ('Annual Registration Fee', 50.00, 'annually', 'Yearly registration and administration')
ON CONFLICT DO NOTHING;

-- 12. Add fee settings to system_settings
INSERT INTO system_settings (setting_key, setting_value, category, description) VALUES (
  'fees',
  '{"auto_generate_invoices": true, "overdue_grace_days": 7, "late_fee_amount": 5.00, "late_fee_enabled": true, "payment_reminder_days": [3, 7, 14], "default_payment_method": "cash"}',
  'fees',
  'Fee management settings and preferences'
) ON CONFLICT (setting_key) DO NOTHING;

-- 13. Create view for fee summary
CREATE OR REPLACE VIEW student_fee_summary AS
SELECT 
  s.id as student_id,
  s.first_name,
  s.last_name,
  s.student_number,
  COUNT(i.id) as total_invoices,
  COUNT(i.id) FILTER (WHERE i.status = 'pending') as pending_invoices,
  COUNT(i.id) FILTER (WHERE i.status = 'overdue') as overdue_invoices,
  COUNT(i.id) FILTER (WHERE i.status = 'paid') as paid_invoices,
  COALESCE(SUM(i.amount_due) FILTER (WHERE i.status IN ('pending', 'partial', 'overdue')), 0) as outstanding_amount,
  COALESCE(SUM(i.amount_paid), 0) as total_paid,
  COALESCE(SUM(i.amount_due), 0) as total_invoiced
FROM students s
LEFT JOIN fee_invoices i ON s.id = i.student_id
GROUP BY s.id, s.first_name, s.last_name, s.student_number;