// lib/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: "super_admin" | "admin" | "teacher" | "parent";
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: "super_admin" | "admin" | "teacher" | "parent";
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: "super_admin" | "admin" | "teacher" | "parent";
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          level: string | null;
          teacher_id: string | null;
          capacity: number | null;
          academic_year: string | null;
          schedule: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          level?: string | null;
          teacher_id?: string | null;
          capacity?: number | null;
          academic_year?: string | null;
          schedule?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          level?: string | null;
          teacher_id?: string | null;
          capacity?: number | null;
          academic_year?: string | null;
          schedule?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          student_number: string | null;
          first_name: string;
          last_name: string;
          //arabic_name: string | null;
          date_of_birth: string | null;
          gender: "male" | "female";
          parent_name: string;
          parent_email: string | null;
          parent_phone: string;
          parent_phone_secondary: string | null;
          parent_telegram_id: string | null;
          address: string | null;
          city: string | null;
          postal_code: string | null;
          class_id: string | null;
          enrollment_date: string | null;
          photo_url: string | null;
          medical_notes: string | null;
          notes: string | null;
          status: "active" | "inactive" | "graduated" | "withdrawn";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_number?: string | null;
          first_name: string;
          last_name: string;
          //arabic_name?: string | null;
          date_of_birth?: string | null;
          gender: "male" | "female";
          parent_name: string;
          parent_email?: string | null;
          parent_phone: string;
          parent_phone_secondary?: string | null;
          parent_telegram_id?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          class_id?: string | null;
          enrollment_date?: string | null;
          photo_url?: string | null;
          medical_notes?: string | null;
          notes?: string | null;
          status?: "active" | "inactive" | "graduated" | "withdrawn";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_number?: string | null;
          first_name?: string;
          last_name?: string;
          // arabic_name?: string | null;
          date_of_birth?: string | null;
          gender?: "male" | "female";
          parent_name?: string;
          parent_email?: string | null;
          parent_phone?: string;
          parent_phone_secondary?: string | null;
          parent_telegram_id?: string | null;
          address?: string | null;
          city?: string | null;
          postal_code?: string | null;
          class_id?: string | null;
          enrollment_date?: string | null;
          photo_url?: string | null;
          medical_notes?: string | null;
          notes?: string | null;
          status?: "active" | "inactive" | "graduated" | "withdrawn";
          created_at?: string;
          updated_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          class_id: string | null;
          date: string;
          status: "present" | "absent" | "late" | "excused" | "sick";
          session_type: "regular" | "prayer" | "quran" | "special";
          session_time: string | null;
          arrival_time: string | null;
          departure_time: string | null;
          notes: string | null;
          marked_by: string | null;
          marked_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          class_id?: string | null;
          date?: string;
          status?: "present" | "absent" | "late" | "excused" | "sick";
          session_type?: "regular" | "prayer" | "quran" | "special";
          session_time?: string | null;
          arrival_time?: string | null;
          departure_time?: string | null;
          notes?: string | null;
          marked_by?: string | null;
          marked_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          class_id?: string | null;
          date?: string;
          status?: "present" | "absent" | "late" | "excused" | "sick";
          session_type?: "regular" | "prayer" | "quran" | "special";
          session_time?: string | null;
          arrival_time?: string | null;
          departure_time?: string | null;
          notes?: string | null;
          marked_by?: string | null;
          marked_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          name_arabic: string | null;
          description: string | null;
          subject_type: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_arabic?: string | null;
          description?: string | null;
          subject_type?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_arabic?: string | null;
          description?: string | null;
          subject_type?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      quran_progress: {
        Row: {
          id: string;
          student_id: string;
          surah_number: number;
          surah_name: string;
          surah_name_arabic: string | null;
          verses_memorized: number | null;
          verses_total: number;
          progress_type: "memorization" | "recitation" | "revision" | "tajweed";
          proficiency_level:
            | "beginner"
            | "intermediate"
            | "advanced"
            | "mastered"
            | null;
          teacher_notes: string | null;
          started_date: string | null;
          completed_date: string | null;
          last_revision_date: string | null;
          recorded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          surah_number: number;
          surah_name: string;
          surah_name_arabic?: string | null;
          verses_memorized?: number | null;
          verses_total: number;
          progress_type?:
            | "memorization"
            | "recitation"
            | "revision"
            | "tajweed";
          proficiency_level?:
            | "beginner"
            | "intermediate"
            | "advanced"
            | "mastered"
            | null;
          teacher_notes?: string | null;
          started_date?: string | null;
          completed_date?: string | null;
          last_revision_date?: string | null;
          recorded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          surah_number?: number;
          surah_name?: string;
          surah_name_arabic?: string | null;
          verses_memorized?: number | null;
          verses_total?: number;
          progress_type?:
            | "memorization"
            | "recitation"
            | "revision"
            | "tajweed";
          proficiency_level?:
            | "beginner"
            | "intermediate"
            | "advanced"
            | "mastered"
            | null;
          teacher_notes?: string | null;
          started_date?: string | null;
          completed_date?: string | null;
          last_revision_date?: string | null;
          recorded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      academic_progress: {
        Row: {
          id: string;
          student_id: string;
          subject_id: string | null;
          class_id: string | null;
          assessment_type: string | null;
          assessment_date: string | null;
          score: number | null;
          max_score: number | null;
          grade: string | null;
          topic: string | null;
          notes: string | null;
          teacher_feedback: string | null;
          recorded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject_id?: string | null;
          class_id?: string | null;
          assessment_type?: string | null;
          assessment_date?: string | null;
          score?: number | null;
          max_score?: number | null;
          grade?: string | null;
          topic?: string | null;
          notes?: string | null;
          teacher_feedback?: string | null;
          recorded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          subject_id?: string | null;
          class_id?: string | null;
          assessment_type?: string | null;
          assessment_date?: string | null;
          score?: number | null;
          max_score?: number | null;
          grade?: string | null;
          topic?: string | null;
          notes?: string | null;
          teacher_feedback?: string | null;
          recorded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
