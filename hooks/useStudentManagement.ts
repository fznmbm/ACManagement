import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface StudentDeletionCheck {
  can_delete: boolean;
  can_cleanup_delete: boolean;
  invoice_count: number;
  fine_count: number;
  assignment_count: number;
  paid_invoice_count: number;
  deletion_type: "safe_delete" | "cleanup_required" | "soft_delete_only";
}

export const useStudentManagement = () => {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const checkStudentDeletion = async (
    studentId: string
  ): Promise<StudentDeletionCheck | null> => {
    try {
      const { data, error } = await supabase.rpc("can_student_be_deleted", {
        student_uuid: studentId,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error checking student deletion:", error);
      return null;
    }
  };

  const updateStudentStatus = async (
    studentId: string,
    newStatus: string,
    reason?: string
  ) => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase.rpc("update_student_status", {
        student_uuid: studentId,
        new_status: newStatus,
        reason_text: reason,
        changed_by_uuid: user?.id,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error updating student status:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const cleanupStudentRecords = async (studentId: string, reason?: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc(
        "cleanup_student_financial_records",
        {
          student_uuid: studentId,
          cleanup_reason: reason || "Student removed from system",
        }
      );

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error cleaning up student records:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (studentId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", studentId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error deleting student:", error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    checkStudentDeletion,
    updateStudentStatus,
    cleanupStudentRecords,
    deleteStudent,
  };
};
