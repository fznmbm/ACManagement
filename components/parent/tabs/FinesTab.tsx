"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Download,
} from "lucide-react";
import { ParentFine } from "@/types/fines";

interface FinesTabProps {
  studentId: string;
}

interface Fine {
  id: string;
  fine_number: string;
  fine_type: "late" | "absence";
  amount: number;
  is_paid: boolean;
  issue_date: string;
  paid_date?: string;
  remarks?: string;
  attendance?: {
    date: string;
    status: string;
  };
}

interface FinesStats {
  totalFines: number;
  totalAmount: number;
  paidCount: number;
  paidAmount: number;
  unpaidCount: number;
  unpaidAmount: number;
}

export default function FinesTab({ studentId }: FinesTabProps) {
  const supabase = createClient();

  const [fines, setFines] = useState<ParentFine[]>([]);
  const [stats, setStats] = useState<FinesStats>({
    totalFines: 0,
    totalAmount: 0,
    paidCount: 0,
    paidAmount: 0,
    unpaidCount: 0,
    unpaidAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");

  useEffect(() => {
    fetchFines();
  }, [studentId]);

  const fetchFines = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user found");
        return;
      }

      console.log("🔍 Fetching fines for student:", studentId);

      // CORRECTED: Using 'fines' table with proper column names
      const { data, error } = await supabase
        .from("fines")
        .select(
          `
        id,
        amount,
        status,
        issued_date,
        paid_date,
        payment_method,
        fine_type,
        student_id,
        attendance:attendance_record_id (
          date,
          status
        )
      `
        )
        .eq("student_id", studentId)
        .order("issued_date", { ascending: false });

      console.log("📊 Fines result:", {
        success: !error,
        count: data?.length || 0,
        error: error?.message,
        data,
      });

      if (error) {
        console.error("❌ Error fetching fines:", error);
        throw error;
      }

      // Verify parent authorization
      const { data: linkCheck } = await supabase
        .from("parent_student_links")
        .select("id")
        .eq("parent_user_id", user.id)
        .eq("student_id", studentId)
        .single();

      if (!linkCheck) {
        console.error("❌ Parent not authorized");
        setFines([]);
        return;
      }

      const finesData = data || [];
      setFines(finesData);

      // Calculate stats
      const totalFines = finesData.length;
      const totalAmount = finesData.reduce((sum, f) => sum + f.amount, 0);
      const paidCount = finesData.filter((f) => f.status === "paid").length;
      const paidAmount = finesData
        .filter((f) => f.status === "paid")
        .reduce((sum, f) => sum + f.amount, 0);
      const unpaidCount = finesData.filter(
        (f) => f.status === "pending"
      ).length;
      const unpaidAmount = finesData
        .filter((f) => f.status === "pending")
        .reduce((sum, f) => sum + f.amount, 0);

      setStats({
        totalFines,
        totalAmount,
        paidCount,
        paidAmount,
        unpaidCount,
        unpaidAmount,
      });
      // Calculate stats...
    } catch (err: any) {
      console.error("❌ Error fetching fines:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFineTypeColor = (type: string) => {
    switch (type) {
      case "late":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400";
      case "absence":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  const getFineTypeIcon = (type: string) => {
    switch (type) {
      case "late":
        return "🕐";
      case "absence":
        return "❌";
      default:
        return "⚠️";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const filteredFines = fines.filter((fine) => {
    if (filter === "paid") return fine.status === "paid";
    if (filter === "unpaid") return fine.status === "pending";
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Total Fines
            </span>
            <AlertTriangle className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.totalFines}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {formatCurrency(stats.totalAmount)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-600 dark:text-green-400">
              Paid
            </span>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.paidCount}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            {formatCurrency(stats.paidAmount)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-red-600 dark:text-red-400">
              Unpaid
            </span>
            <XCircle className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
            {stats.unpaidCount}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            {formatCurrency(stats.unpaidAmount)}
          </p>
        </div>
      </div>

      {/* Outstanding Fines Alert */}
      {stats.unpaidAmount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-400 mb-1">
                Outstanding Fines
              </h4>
              <p className="text-sm text-red-700 dark:text-red-400">
                You have {stats.unpaidCount} unpaid fine
                {stats.unpaidCount !== 1 ? "s" : ""} totaling{" "}
                {formatCurrency(stats.unpaidAmount)}. Please contact the
                administration office to arrange payment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Fines History
        </h3>
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            All ({stats.totalFines})
          </button>
          <button
            onClick={() => setFilter("unpaid")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "unpaid"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Unpaid ({stats.unpaidCount})
          </button>
          <button
            onClick={() => setFilter("paid")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === "paid"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Paid ({stats.paidCount})
          </button>
        </div>
      </div>

      {/* Fines List */}
      {filteredFines.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400">
            {filter === "all"
              ? "No fines issued"
              : filter === "paid"
              ? "No paid fines"
              : "No unpaid fines"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFines.map((fine) => (
            <div
              key={fine.id}
              className={`bg-white dark:bg-slate-800 rounded-lg border p-4 transition-all ${
                fine.is_paid
                  ? "border-slate-200 dark:border-slate-700"
                  : "border-red-200 dark:border-red-800 shadow-sm"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">
                      {getFineTypeIcon(fine.fine_type)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {fine.fine_type === "late"
                            ? "Late Arrival Fine"
                            : "Absence Fine"}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getFineTypeColor(
                            fine.fine_type
                          )}`}
                        >
                          {fine.fine_type.toUpperCase()}
                        </span>
                      </div>
                      {fine.attendance && (
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Related to: {fine.attendance.status} on{" "}
                          {new Date(fine.attendance.date).toLocaleDateString(
                            "en-GB"
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Issue Date
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {new Date(fine.issued_date).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Amount
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {formatCurrency(fine.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Status
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                          fine.status === "paid"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                        }`}
                      >
                        {fine.status === "paid" ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            PAID
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            UNPAID
                          </>
                        )}
                      </span>
                    </div>
                    {fine.status === "paid" && fine.paid_date && (
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          Paid Date
                        </p>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          {new Date(fine.paid_date).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                    )}
                  </div>

                  {fine.remarks && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">
                        Remarks:
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {fine.remarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Information */}
      {stats.unpaidAmount > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Payment Information
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
            To settle your outstanding fines, please contact the administration
            office during school hours:
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 ml-4">
            <li>• Monday - Friday: 9:00 AM - 4:00 PM</li>
            <li>• Saturday: 10:00 AM - 2:00 PM</li>
            <li>• Payment methods: Cash, Card, Bank Transfer</li>
          </ul>
        </div>
      )}
    </div>
  );
}
