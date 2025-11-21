export interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  frequency: "monthly" | "quarterly" | "annually" | "one_time";
  description?: string;
  is_active: boolean;
  due_day: number;
  grace_period_days: number;
}

export interface FeeInvoice {
  id: string;
  invoice_number: string;
  student_id: string;
  fee_structure_id: string;
  period_start: string;
  period_end: string;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  status: "pending" | "partial" | "paid" | "overdue" | "cancelled";
  generated_date: string;
  notes?: string;
  students?: {
    first_name: string;
    last_name: string;
    student_number: string;
  };
  fee_structures?: {
    name: string;
    frequency: string;
  };
}

export interface FeePayment {
  id: string;
  invoice_id: string;
  payment_reference?: string;
  amount: number;
  payment_date: string;
  payment_method: "cash" | "card" | "bank_transfer" | "cheque" | "online";
  collected_by?: string;
  notes?: string;
}

export interface StudentFeeData {
  student_id: string;
  pending_invoices: number;
  overdue_invoices: number;
  outstanding_amount: number;
  total_paid: number;
}

export interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
}
