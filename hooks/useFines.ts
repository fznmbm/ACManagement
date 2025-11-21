// hooks/useFines.ts
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Fine } from "@/types/fines";

interface StudentFine {
  student_id: string;
  pending_fines: number;
  pending_amount: number;
  total_fines: number;
  paid_amount: number;
}

// interface FineDetail {
//   id: string;
//   fine_type: string;
//   amount: number;
//   status: string;
//   issued_date: string;
//   paid_date?: string;
//   attendance_record_id: string;
// }

export function useFines() {
  const [studentFines, setStudentFines] = useState<Record<string, StudentFine>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchStudentFines = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("student_fine_summary")
        .select("*");

      if (fetchError) throw fetchError;

      // Convert array to object keyed by student_id
      const finesMap = (data || []).reduce((acc, fine) => {
        acc[fine.student_id] = {
          student_id: fine.student_id,
          pending_fines: fine.pending_fines || 0,
          pending_amount: parseFloat(fine.pending_amount || "0"),
          total_fines: fine.total_fines || 0,
          paid_amount: parseFloat(fine.paid_amount || "0"),
        };
        return acc;
      }, {} as Record<string, StudentFine>);

      setStudentFines(finesMap);
    } catch (err) {
      console.error("Error fetching student fines:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch fines");
    } finally {
      setLoading(false);
    }
  };

  const getStudentFines = (studentId: string): StudentFine => {
    return (
      studentFines[studentId] || {
        student_id: studentId,
        pending_fines: 0,
        pending_amount: 0,
        total_fines: 0,
        paid_amount: 0,
      }
    );
  };

  const fetchStudentFineDetails = async (
    studentId: string
  ): Promise<Fine[]> => {
    try {
      const { data, error } = await supabase
        .from("fines")
        .select("*")
        .eq("student_id", studentId)
        .eq("status", "pending")
        .order("issued_date", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching fine details:", err);
      return [];
    }
  };

  const refreshFines = () => {
    fetchStudentFines();
  };

  useEffect(() => {
    fetchStudentFines();

    // Subscribe to changes in fines table
    const subscription = supabase
      .channel("fines_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fines",
        },
        () => {
          // Refresh fines when any change occurs
          fetchStudentFines();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    studentFines,
    loading,
    error,
    getStudentFines,
    fetchStudentFineDetails,
    refreshFines,
  };
}
