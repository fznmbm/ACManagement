"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DollarSign,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

interface FeeInvoice {
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
  description?: string;
  fee_payments: FeePayment[];
}

interface FeePayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_reference?: string;
}

interface FeesStats {
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  totalBalance: number;
  pendingCount: number;
  overdueCount: number;
}

interface FeesTabProps {
  studentId: string;
}

export default function FeesTab({ studentId }: FeesTabProps) {
  const supabase = createClient();

  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [stats, setStats] = useState<FeesStats>({
    totalInvoices: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalBalance: 0,
    pendingCount: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<FeeInvoice | null>(
    null
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchFees();
  }, [studentId]);

  const fetchFees = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No user found");
        return;
      }

      console.log(
        "🔍 Fetching fees for student:",
        studentId,
        "parent:",
        user.id
      );

      // CORRECTED: Using proper column names
      const { data, error } = await supabase
        .from("fee_invoices")
        .select(
          `
        id,
        invoice_number,
        amount_due,
        amount_paid,
        status,
        generated_date,
        due_date,
        period_start,
        period_end,
        period_name,
        notes,
        student_id,
        fee_payments (
          id,
          amount,
          payment_date,
          payment_method,
          payment_reference
        )
      `
        )
        .eq("student_id", studentId)
        .order("generated_date", { ascending: false });

      console.log("📊 Invoices result:", {
        success: !error,
        count: data?.length || 0,
        error: error?.message,
        data,
      });

      if (error) {
        console.error("❌ Error fetching fees:", error);
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
        console.error("❌ Parent not authorized for this student");
        setInvoices([]);
        return;
      }

      console.log("✅ Parent authorization confirmed");

      // Transform data to match component interface
      const transformedInvoices =
        data?.map((inv) => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          amount: inv.amount_due,
          paid_amount: inv.amount_paid,
          balance: inv.amount_due - inv.amount_paid,
          status: inv.status as
            | "pending"
            | "paid"
            | "partially_paid"
            | "overdue",
          issue_date: inv.generated_date,
          due_date: inv.due_date,
          billing_period_start: inv.period_start,
          billing_period_end: inv.period_end,
          description: inv.period_name || inv.notes,
          fee_payments: inv.fee_payments || [],
        })) || [];

      setInvoices(transformedInvoices);

      // Calculate statistics
      const totalInvoices = transformedInvoices.length;
      const totalAmount = transformedInvoices.reduce(
        (sum, inv) => sum + inv.amount,
        0
      );
      const totalPaid = transformedInvoices.reduce(
        (sum, inv) => sum + inv.paid_amount,
        0
      );
      const totalBalance = transformedInvoices.reduce(
        (sum, inv) => sum + inv.balance,
        0
      );
      const pendingCount = transformedInvoices.filter(
        (inv) => inv.status === "pending" || inv.status === "partially_paid"
      ).length;
      const overdueCount = transformedInvoices.filter(
        (inv) => inv.status === "overdue"
      ).length;

      setStats({
        totalInvoices,
        totalAmount,
        totalPaid,
        totalBalance,
        pendingCount,
        overdueCount,
      });

      console.log("📈 Stats calculated:", {
        totalInvoices,
        totalAmount,
        totalPaid,
        totalBalance,
        pendingCount,
        overdueCount,
      });
    } catch (err: any) {
      console.error("❌ Error fetching fees:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "partially_paid":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      case "overdue":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount);
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Total Invoices
            </span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.totalInvoices}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-600 dark:text-blue-400">
              Total Amount
            </span>
            <DollarSign className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {formatCurrency(stats.totalAmount)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-600 dark:text-green-400">
              Total Paid
            </span>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {formatCurrency(stats.totalPaid)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-red-600 dark:text-red-400">
              Balance Due
            </span>
            <AlertCircle className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
            {formatCurrency(stats.totalBalance)}
          </p>
        </div>
      </div>

      {/* Outstanding Balance Alert */}
      {stats.totalBalance > 0 && (
        <div
          className={`rounded-lg border p-4 ${
            stats.overdueCount > 0
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
          }`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className={`h-5 w-5 mt-0.5 ${
                stats.overdueCount > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-yellow-600 dark:text-yellow-400"
              }`}
            />
            <div className="flex-1">
              <h4
                className={`font-semibold mb-1 ${
                  stats.overdueCount > 0
                    ? "text-red-900 dark:text-red-400"
                    : "text-yellow-900 dark:text-yellow-400"
                }`}
              >
                {stats.overdueCount > 0
                  ? "Overdue Payment"
                  : "Payment Reminder"}
              </h4>
              <p
                className={`text-sm ${
                  stats.overdueCount > 0
                    ? "text-red-700 dark:text-red-400"
                    : "text-yellow-700 dark:text-yellow-400"
                }`}
              >
                You have an outstanding balance of{" "}
                {formatCurrency(stats.totalBalance)}.
                {stats.overdueCount > 0 &&
                  ` ${stats.overdueCount} invoice(s) are overdue.`}{" "}
                Please contact the administration office to arrange payment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invoices List */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Invoices & Payments
        </h3>

        {invoices.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
            <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">
              No invoices generated yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {invoice.invoice_number}
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {getStatusIcon(invoice.status)}
                          {invoice.status.replace("_", " ").toUpperCase()}
                        </span>
                        {invoice.status === "overdue" && (
                          <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                            Due{" "}
                            {new Date(invoice.due_date).toLocaleDateString(
                              "en-GB"
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Billing Period:{" "}
                        {new Date(
                          invoice.billing_period_start
                        ).toLocaleDateString("en-GB")}{" "}
                        -{" "}
                        {new Date(
                          invoice.billing_period_end
                        ).toLocaleDateString("en-GB")}
                      </p>
                      {invoice.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {invoice.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedInvoice(invoice);
                        setShowPaymentModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      View Details
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 border-t border-slate-200 dark:border-slate-700">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Issue Date
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {new Date(invoice.issue_date).toLocaleDateString(
                          "en-GB"
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Due Date
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          isOverdue(invoice.due_date) &&
                          invoice.status !== "paid"
                            ? "text-red-600 dark:text-red-400"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {new Date(invoice.due_date).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Amount
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {formatCurrency(invoice.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        Balance
                      </p>
                      <p
                        className={`text-sm font-medium ${
                          invoice.balance > 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {formatCurrency(invoice.balance)}
                      </p>
                    </div>
                  </div>

                  {/* Payment History */}
                  {invoice.fee_payments && invoice.fee_payments.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Payment History:
                      </p>
                      <div className="space-y-2">
                        {invoice.fee_payments.map((payment) => (
                          <div
                            key={payment.id}
                            className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-slate-600 dark:text-slate-400">
                                {new Date(
                                  payment.payment_date
                                ).toLocaleDateString("en-GB")}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                ({payment.payment_method})
                              </span>
                            </div>
                            <span className="font-medium text-green-600 dark:text-green-400">
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Invoice Details
                </h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedInvoice(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Invoice Number
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedInvoice.invoice_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Status
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(
                      selectedInvoice.status
                    )}`}
                  >
                    {selectedInvoice.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Issue Date
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {new Date(selectedInvoice.issue_date).toLocaleDateString(
                      "en-GB"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                    Due Date
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {new Date(selectedInvoice.due_date).toLocaleDateString(
                      "en-GB"
                    )}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Invoice Amount:
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(selectedInvoice.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Amount Paid:
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(selectedInvoice.paid_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Balance Due:
                    </span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      {formatCurrency(selectedInvoice.balance)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-400">
                  <strong>Note:</strong> To make a payment, please contact the
                  administration office or use the payment methods provided in
                  your enrollment documentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
