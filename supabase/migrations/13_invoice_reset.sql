-- Reset invoices and fee data only
DELETE FROM fee_payments;
DELETE FROM fee_invoices;
DELETE FROM student_fee_assignments;

-- Verify
SELECT 'fee_payments' as table_name, COUNT(*) as remaining FROM fee_payments
UNION ALL SELECT 'fee_invoices', COUNT(*) FROM fee_invoices
UNION ALL SELECT 'student_fee_assignments', COUNT(*) FROM student_fee_assignments;