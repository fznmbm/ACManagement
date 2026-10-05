export interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  frequency: "monthly" | "quarterly" | "annually" | "one_time";
  description?: string | null;
  is_active: boolean;
  due_day: number;
  grace_period_days: number;
  use_custom_quarters?: boolean;
}

export interface FeeInvoice {
  id: string;
  invoice_number: string;
  student_id: string;
  fee_structure_id: string;
  period_start: string;
  period_end: string;
  period_name?: string | null;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  status: "pending" | "partial" | "paid" | "overdue" | "cancelled";
  generated_date: string;
  notes?: string | null;
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
  payment_reference?: string | null;
  amount: number;
  payment_date: string;
  payment_method: "cash" | "card" | "bank_transfer" | "cheque" | "online";
  collected_by?: string | null;
  notes?: string | null;
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

// Parent portal interfaces
export interface ParentInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  amount_paid?: number;
  status: "paid" | "pending" | "partial" | "overdue";
  paid_date?: string | null;
  payment_method?: string | null;
  description?: string | null;
  student: {
    first_name: string;
    last_name: string;
    student_number: string;
  };
}

export interface ParentFeeInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  paid_amount: number;
  balance: number;
  status: "pending" | "paid" | "partially_paid" | "overdue";
  issue_date: string;
  due_date: string;
  billing_period_start: string;
  billing_period_end: string;
  description?: string | null;
  fee_payments: FeePayment[];
}
