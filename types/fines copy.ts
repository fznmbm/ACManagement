export interface Fine {
  id: string;
  student_id: string;
  class_id?: string;
  fine_type: string;
  amount: number;
  status: string;
  issued_date: string;
  paid_date?: string;
  payment_method?: string;
  notes?: string;
  attendance_record_id: string;
  students?: {
    first_name: string;
    last_name: string;
    student_number: string;
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
