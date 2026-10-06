"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import {
  Download,
  Receipt,
  FileText,
  CreditCard,
  Calendar,
  Landmark,
  Info,
} from "lucide-react";
import { ParentFine } from "@/types/fines";
import { ParentInvoice } from "@/types/fees";
import { formatMoney } from "@/lib/utils/helpers";

// Bank details for the "How to pay" panel. Set these in Vercel env
// (NEXT_PUBLIC_BANK_ACCOUNT_NAME / _SORT_CODE / _ACCOUNT_NUMBER). If unset,
// the panel tells parents to contact the office instead of showing blanks.
const BANK = {
  accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || "",
  sortCode: process.env.NEXT_PUBLIC_BANK_SORT_CODE || "",
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || "",
};

// interface Invoice {
//   id: string;
//   invoice_number: string;
//   invoice_date: string;
//   due_date: string;
//   amount: number;
//   status: "paid" | "pending" | "overdue";
//   paid_date?: string;
//   payment_method?: string;
//   description?: string;
//   student: {
//     first_name: string;
//     last_name: string;
//     student_number: string;
//   };
// }

// interface Fine {
//   id: string;
//   amount: number;
//   status: "paid" | "pending" | "waived";
//   paid_date?: string;
//   payment_method?: string;
//   created_at: string;
//   attendance: {
//     attendance_date: string;
//     status: string;
//   };
//   student: {
//     first_name: string;
//     last_name: string;
//     student_number: string;
//   };
// }

interface StudentInfo {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
}

interface InvoiceDisplay extends ParentInvoice {
  student: StudentInfo;
}

interface FineDisplay extends ParentFine {
  student: StudentInfo;
}

export default function ParentFinancesPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [invoices, setInvoices] = useState<InvoiceDisplay[]>([]);
  const [fines, setFines] = useState<FineDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"invoices" | "fines" | "history">(
    "invoices",
  );

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("❌ No user found");
        return;
      }

      console.log("🔍 Fetching financial data for parent:", user.id);

      // Get all student IDs linked to this parent
      const { data: links, error: linkError } = await supabase
        .from("parent_student_links")
        .select("student_id")
        .eq("parent_user_id", user.id);

      console.log("👥 Student links:", { links, error: linkError });

      if (linkError || !links || links.length === 0) {
        console.log("⚠️ No students linked to parent");
        return;
      }

      const studentIds = links.map((l) => l.student_id);
      console.log("📋 Student IDs:", studentIds);

      // Viewing the Finances page counts as reading the fine/fee notifications,
      // so clear them here (the badge elsewhere then drops to reflect reality).
      supabase
        .from("parent_notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("parent_user_id", user.id)
        .in("student_id", studentIds)
        .in("type", ["fine", "fee_alert"])
        .eq("is_read", false)
        .then(() => {});

      // Fetch students data
      const { data: studentsData } = await supabase
        .from("students")
        .select("id, first_name, last_name, student_number")
        .in("id", studentIds);

      // CORRECTED: Fetch invoices with proper column names
      const { data: invoicesRaw, error: invoiceError } = await supabase
        .from("fee_invoices")
        .select(
          `
        id,
        invoice_number,
        generated_date,
        due_date,
        amount_due,
        amount_paid,
        status,
        period_name,
        notes,
        student_id
      `,
        )
        .in("student_id", studentIds)
        .order("generated_date", { ascending: false });

      console.log("💰 Invoices query:", {
        count: invoicesRaw?.length || 0,
        error: invoiceError?.message,
        sample: invoicesRaw?.[0],
      });

      // Map student info and transform to match interface
      const invoicesData =
        invoicesRaw?.map((inv) => {
          const student = studentsData?.find((s) => s.id === inv.student_id);
          return {
            id: inv.id,
            invoice_number: inv.invoice_number,
            invoice_date: inv.generated_date,
            due_date: inv.due_date,
            amount: inv.amount_due,
            amount_paid: inv.amount_paid ?? 0,
            status: inv.status as "paid" | "pending" | "partial" | "overdue",
            paid_date: inv.status === "paid" ? inv.generated_date : null,
            payment_method: null,
            description: inv.period_name || inv.notes,
            student: student || {
              id: "",
              first_name: "",
              last_name: "",
              student_number: "",
            },
          };
        }) || [];

      // CORRECTED: Fetch fines with proper table/column names
      const { data: finesRaw, error: fineError } = await supabase
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
        attendance_record_id,
        attendance:attendance_record_id (
          date,
          status
        )
      `,
        )
        .in("student_id", studentIds)
        .order("issued_date", { ascending: false });

      console.log("🚨 Fines query:", {
        count: finesRaw?.length || 0,
        error: fineError?.message,
        sample: finesRaw?.[0],
      });

      // Map student info to fines
      const finesData =
        finesRaw?.map((fine) => {
          const student = studentsData?.find((s) => s.id === fine.student_id);
          return {
            id: fine.id,
            amount: fine.amount,
            status: fine.status as "paid" | "pending" | "waived",
            fine_type: fine.fine_type as "late" | "absent",
            issued_date: fine.issued_date,
            paid_date: fine.paid_date || null,
            payment_method: fine.payment_method || null,
            attendance:
              fine.attendance &&
              Array.isArray(fine.attendance) &&
              fine.attendance.length > 0
                ? {
                    date: fine.attendance[0].date,
                    status: fine.attendance[0].status,
                  }
                : null,
            student: student || {
              id: "",
              first_name: "",
              last_name: "",
              student_number: "",
            },
          };
        }) || [];

      console.log("✅ Data fetched:", {
        invoices: invoicesData.length,
        fines: finesData.length,
      });

      setInvoices(invoicesData);
      setFines(finesData);
    } catch (error: any) {
      console.error("❌ Error fetching financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setDownloading(invoiceId);

      const response = await fetch(`/api/parent/invoice/${invoiceId}/download`);

      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    } finally {
      setDownloading(null);
    }
  };

  const downloadFineReceipt = async (fineId: string) => {
    try {
      setDownloading(fineId);

      const response = await fetch(`/api/parent/fine/${fineId}/download`);

      if (!response.ok) {
        throw new Error("Failed to download receipt");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fine-receipt-${fineId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt");
    } finally {
      setDownloading(null);
    }
  };

  const calculateTotals = () => {
    const totalInvoices = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    // Money actually received = sum of amount_paid across all invoices
    // (includes part-payments, not just fully-paid invoices).
    const paidInvoices = invoices.reduce(
      (sum, inv) => sum + (inv.amount_paid || 0),
      0,
    );
    // Money still owed = remaining balance on every unpaid/partial/overdue
    // invoice (was: full amount of pending ones only, dropping partials).
    const pendingInvoices = invoices
      .filter(
        (inv) => inv.status !== "paid" && inv.status !== ("cancelled" as any),
      )
      .reduce((sum, inv) => sum + (inv.amount - (inv.amount_paid || 0)), 0);

    const totalFines = fines.reduce((sum, fine) => sum + fine.amount, 0);
    const paidFines = fines
      .filter((fine) => fine.status === "paid")
      .reduce((sum, fine) => sum + fine.amount, 0);
    const pendingFines = fines
      .filter((fine) => fine.status === "pending")
      .reduce((sum, fine) => sum + fine.amount, 0);

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      totalFines,
      paidFines,
      pendingFines,
      totalOwed: pendingInvoices + pendingFines,
    };
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Financial Overview
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage invoices, fines, and payment history
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Total Outstanding
                </p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                  {formatMoney(totals.totalOwed)}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                <CreditCard className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Pending Invoices
                </p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                  {formatMoney(totals.pendingInvoices)}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Pending Fines
                </p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {formatMoney(totals.pendingFines)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <Receipt className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Total Paid
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {formatMoney(totals.paidInvoices + totals.paidFines)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* How to pay */}
        {totals.totalOwed > 0 && (
          <div className="mb-8 rounded-lg border border-primary/30 bg-primary/5 dark:bg-primary/10 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 rounded-full bg-primary/10 p-2">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  How to pay
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Pay by bank transfer using the details below, then keep your
                  confirmation. The office will mark your account as paid once
                  the transfer is received.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Bank transfer to
                    </p>
                    {BANK.accountName || BANK.sortCode || BANK.accountNumber ? (
                      <dl className="mt-2 space-y-1 text-sm">
                        {BANK.accountName && (
                          <div className="flex justify-between gap-4">
                            <dt className="text-slate-500 dark:text-slate-400">
                              Account name
                            </dt>
                            <dd className="font-medium text-slate-900 dark:text-white text-right">
                              {BANK.accountName}
                            </dd>
                          </div>
                        )}
                        {BANK.sortCode && (
                          <div className="flex justify-between gap-4">
                            <dt className="text-slate-500 dark:text-slate-400">
                              Sort code
                            </dt>
                            <dd className="font-mono font-medium text-slate-900 dark:text-white">
                              {BANK.sortCode}
                            </dd>
                          </div>
                        )}
                        {BANK.accountNumber && (
                          <div className="flex justify-between gap-4">
                            <dt className="text-slate-500 dark:text-slate-400">
                              Account number
                            </dt>
                            <dd className="font-mono font-medium text-slate-900 dark:text-white">
                              {BANK.accountNumber}
                            </dd>
                          </div>
                        )}
                      </dl>
                    ) : (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        Please contact the school office for the bank account
                        details.
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Payment reference
                    </p>
                    <p className="mt-2 flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
                      <span>
                        Use your{" "}
                        <strong className="text-slate-900 dark:text-white">
                          invoice number
                        </strong>{" "}
                        (shown on each invoice below) as the payment reference
                        so we can match your payment to the right child.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("invoices")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "invoices"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
                }`}
              >
                Fee Invoices ({invoices.length})
              </button>
              <button
                onClick={() => setActiveTab("fines")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "fines"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
                }`}
              >
                Attendance Fines ({fines.length})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "history"
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
                }`}
              >
                Payment History
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Invoices Tab */}
            {activeTab === "invoices" && (
              <div className="space-y-4">
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No invoices found
                    </p>
                  </div>
                ) : (
                  invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {invoice.invoice_number}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                invoice.status === "paid"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                  : invoice.status === "overdue"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                    : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                              }`}
                            >
                              {invoice.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-600 dark:text-slate-400">
                                Student
                              </p>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {invoice.student.first_name}{" "}
                                {invoice.student.last_name}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-600 dark:text-slate-400">
                                Invoice Date
                              </p>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {new Date(
                                  invoice.invoice_date,
                                ).toLocaleDateString("en-GB")}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-600 dark:text-slate-400">
                                Due Date
                              </p>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {new Date(invoice.due_date).toLocaleDateString(
                                  "en-GB",
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-600 dark:text-slate-400">
                                Amount
                              </p>
                              <p className="font-bold text-lg text-slate-900 dark:text-white">
                                {formatMoney(invoice.amount)}
                              </p>
                            </div>
                          </div>
                          {invoice.paid_date && (
                            <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                              Paid on{" "}
                              {new Date(invoice.paid_date).toLocaleDateString(
                                "en-GB",
                              )}
                              {invoice.payment_method &&
                                ` via ${invoice.payment_method}`}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            downloadInvoice(invoice.id, invoice.invoice_number)
                          }
                          disabled={downloading === invoice.id}
                          className="ml-4 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Download Invoice"
                        >
                          {downloading === invoice.id ? (
                            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                          ) : (
                            <Download className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Fines Tab */}
            {activeTab === "fines" && (
              <div className="space-y-4">
                {fines.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No fines found
                    </p>
                  </div>
                ) : (
                  fines.map((fine) => (
                    <div
                      key={fine.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900 dark:text-white">
                              {fine.fine_type === "late"
                                ? "Late Arrival Fine"
                                : "Absence Fine"}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                fine.status === "paid"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                  : fine.status === "waived"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                    : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                              }`}
                            >
                              {fine.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-600 dark:text-slate-400">
                                Student
                              </p>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {fine.student.first_name}{" "}
                                {fine.student.last_name}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-600 dark:text-slate-400">
                                Date
                              </p>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {fine.attendance
                                  ? new Date(
                                      fine.attendance.date,
                                    ).toLocaleDateString("en-GB")
                                  : "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-600 dark:text-slate-400">
                                Reason
                              </p>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {fine.fine_type === "late"
                                  ? "Late Arrival"
                                  : "Absence"}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-600 dark:text-slate-400">
                                Amount
                              </p>
                              <p className="font-bold text-lg text-red-600 dark:text-red-400">
                                {formatMoney(fine.amount)}
                              </p>
                            </div>
                          </div>
                          {fine.paid_date && (
                            <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                              Paid on{" "}
                              {new Date(fine.paid_date).toLocaleDateString(
                                "en-GB",
                              )}
                              {fine.payment_method &&
                                ` via ${fine.payment_method}`}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => downloadFineReceipt(fine.id)}
                          disabled={downloading === fine.id}
                          className="ml-4 p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Download Receipt"
                        >
                          {downloading === fine.id ? (
                            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
                          ) : (
                            <Download className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Payment History Tab */}
            {activeTab === "history" && (
              <div className="space-y-4">
                {[
                  ...invoices.filter((i) => i.status === "paid"),
                  ...fines.filter((f) => f.status === "paid"),
                ].sort(
                  (a, b) =>
                    new Date(b.paid_date || "").getTime() -
                    new Date(a.paid_date || "").getTime(),
                ).length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                      No payment history
                    </p>
                  </div>
                ) : (
                  [
                    ...invoices.filter((i) => i.status === "paid"),
                    ...fines.filter((f) => f.status === "paid"),
                  ]
                    .sort(
                      (a, b) =>
                        new Date(b.paid_date || "").getTime() -
                        new Date(a.paid_date || "").getTime(),
                    )
                    .map((payment) => {
                      const isInvoice = "invoice_number" in payment;
                      return (
                        <div
                          key={payment.id}
                          className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className={`p-3 rounded-full ${
                                  isInvoice
                                    ? "bg-blue-100 dark:bg-blue-900/20"
                                    : "bg-red-100 dark:bg-red-900/20"
                                }`}
                              >
                                {isInvoice ? (
                                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                ) : (
                                  <Receipt className="h-5 w-5 text-red-600 dark:text-red-400" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900 dark:text-white">
                                  {isInvoice
                                    ? //? (payment as Invoice).invoice_number
                                      (payment as InvoiceDisplay).invoice_number
                                    : "Attendance Fine"}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                  {payment.student.first_name}{" "}
                                  {payment.student.last_name}
                                </p>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                  Paid on{" "}
                                  {new Date(
                                    payment.paid_date || "",
                                  ).toLocaleDateString("en-GB")}
                                  {payment.payment_method &&
                                    ` via ${payment.payment_method}`}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-slate-900 dark:text-white">
                                {formatMoney(payment.amount)}
                              </p>
                              <button
                                onClick={() =>
                                  isInvoice
                                    ? downloadInvoice(
                                        payment.id,
                                        (payment as InvoiceDisplay)
                                          .invoice_number,
                                      )
                                    : downloadFineReceipt(payment.id)
                                }
                                disabled={downloading === payment.id}
                                className="mt-2 text-sm text-primary hover:underline disabled:opacity-50"
                              >
                                {downloading === payment.id
                                  ? "Downloading..."
                                  : "Download"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
