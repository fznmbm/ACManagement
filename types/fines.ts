// Base Fine interface (matches database exactly)
export interface Fine {
  id: string;
  student_id: string;
  fine_type: "late" | "absent";
  amount: number;
  status: "pending" | "paid" | "waived";
  issued_date: string;
  paid_date?: string | null;
  payment_method?: string | null;
  notes?: string | null;
  attendance_record_id: string;
  collected_by?: string | null;
  // Relations (when using SELECT with joins)
  students?: {
    first_name: string;
    last_name: string;
    student_number: string;
    class_id?: string; // ← Class accessed through student
    classes?: {
      name: string;
    };
  };
  attendance?: {
    date: string;
    status: string;
  };
  collected_by_profile?: {
    full_name: string;
  };
}

export interface StudentFineData {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
}

// Parent portal specific (simplified)
export interface ParentFine {
  id: string;
  amount: number;
  status: "pending" | "paid" | "waived";
  fine_type: "late" | "absent";
  issued_date: string;
  paid_date?: string | null;
  payment_method?: string | null;
  attendance: {
    date: string;
    status: string;
  } | null;
}
