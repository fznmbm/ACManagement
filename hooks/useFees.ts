"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface StudentFeeData {
  student_id: string;
  pending_invoices: number;
  overdue_invoices: number;
  outstanding_amount: number;
  total_paid: number;
}

export function useFees() {
  const [studentFees, setStudentFees] = useState<
    Record<string, StudentFeeData>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchStudentFees = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("student_fee_summary")
        .select("*");

      if (fetchError) throw fetchError;

      const feesMap = (data || []).reduce((acc, fee) => {
        acc[fee.student_id] = {
          student_id: fee.student_id,
          pending_invoices: fee.pending_invoices || 0,
          overdue_invoices: fee.overdue_invoices || 0,
          outstanding_amount: parseFloat(fee.outstanding_amount || "0"),
          total_paid: parseFloat(fee.total_paid || "0"),
        };
        return acc;
      }, {} as Record<string, StudentFeeData>);

      setStudentFees(feesMap);
    } catch (err) {
      console.error("Error fetching student fees:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch fees");
    } finally {
      setLoading(false);
    }
  };

  const getStudentFees = (studentId: string): StudentFeeData => {
    return (
      studentFees[studentId] || {
        student_id: studentId,
        pending_invoices: 0,
        overdue_invoices: 0,
        outstanding_amount: 0,
        total_paid: 0,
      }
    );
  };

  const fetchStudentInvoices = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from("fee_invoices")
        .select(
          `
          *,
          fee_structures (name, frequency)
        `
        )
        .eq("student_id", studentId)
        .in("status", ["pending", "partial", "overdue"])
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching student invoices:", err);
      return [];
    }
  };

  const refreshFees = () => {
    fetchStudentFees();
  };

  useEffect(() => {
    fetchStudentFees();

    const subscription = supabase
      .channel("fees_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fee_invoices" },
        () => {
          fetchStudentFees();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "fee_payments" },
        () => {
          fetchStudentFees();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    studentFees,
    loading,
    error,
    getStudentFees,
    fetchStudentInvoices,
    refreshFees,
  };
}
