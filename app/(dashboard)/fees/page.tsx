// app/(dashboard)/fees/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, Plus } from "lucide-react";
import FeePaymentModal from "@/components/fees/FeePaymentModal";
import FinanceTabs from "@/components/finance/FinanceTabs";
import ReasonDialog from "@/components/ui/ReasonDialog";
import { Pagination } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils/helpers";
import { FeeInvoice, StudentData } from "@/types/fees";

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  is_active: boolean;
  description?: string;
}

const PAGE_SIZE = 20;

export default function FeesPage() {
  const supabase = createClient();
  const { toast, confirm } = useToast();

  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(
    null,
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [outstandingInvoices, setOutstandingInvoices] = useState<FeeInvoice[]>(
    [],
  );

  const [classFilter, setClassFilter] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [feeTypeFilter, setFeeTypeFilter] = useState("");

  const [students, setStudents] = useState<
    { id: string; first_name: string; last_name: string; student_number: string }[]
  >([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [page, setPage] = useState(1);

  // Cancel-with-reason dialog
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchFeeStructures();
    fetchStudents();
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchInvoices();
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter, studentFilter, dateFromFilter, dateToFilter]);

  useEffect(() => {
    setPage(1);
  }, [filter, feeTypeFilter]);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("id, first_name, last_name, student_number")
      .eq("status", "active")
      .order("first_name");
    if (!error) setStudents(data || []);
  };

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from("classes")
      .select("id, name")
      .order("name");
    if (!error) setClasses(data || []);
  };

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("fee_invoices")
        .select(
          `*, students (first_name, last_name, student_number, class_id, status), fee_structures (name, frequency)`,
        )
        .order("due_date", { ascending: false });
      if (error) throw error;

      // Class / student / date are applied here (once).
      let filtered = data || [];
      if (classFilter)
        filtered = filtered.filter((i) => i.students?.class_id === classFilter);
      if (studentFilter)
        filtered = filtered.filter((i) => i.student_id === studentFilter);
      if (dateFromFilter)
        filtered = filtered.filter((i) => i.due_date >= dateFromFilter);
      if (dateToFilter)
        filtered = filtered.filter((i) => i.due_date <= dateToFilter);

      setInvoices(filtered);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeStructures = async () => {
    try {
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      setFeeStructures(data || []);
    } catch (error) {
      console.error("Error fetching fee structures:", error);
    }
  };

  const handleViewStudentInvoices = async (student: any) => {
    try {
      const { data, error } = await supabase
        .from("fee_invoices")
        .select(`*, fee_structures (name, frequency)`)
        .eq("student_id", student.id)
        .in("status", ["pending", "partial", "overdue"])
        .order("due_date", { ascending: true });
      if (error) throw error;
      setSelectedStudent({
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        student_number: student.student_number,
      });
      setOutstandingInvoices(data || []);
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Error fetching student invoices:", error);
    }
  };

  const confirmCancel = async (reason: string) => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("fee_invoices")
        .update({
          status: "cancelled",
          notes: reason || "Cancelled by admin",
          updated_at: new Date().toISOString(),
        })
        .eq("id", cancelTarget);
      if (error) throw error;
      setCancelTarget(null);
      fetchInvoices();
      toast.success("Invoice cancelled");
    } catch (error) {
      console.error("Error cancelling invoice:", error);
      toast.error("Couldn't cancel the invoice. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  const generateInvoices = async () => {
    const ok = await confirm({
      title: "Generate invoices?",
      message:
        "Generate new invoices for all active fee structures. This may take a moment.",
      confirmText: "Generate",
    });
    if (!ok) return;
    try {
      setLoading(true);
      const response = await fetch("/api/fees/generate-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to generate invoices");
      const result = await response.json();
      toast.success(`Generated ${result.count} invoice(s)`);
      fetchInvoices();
    } catch (error) {
      console.error("Error generating invoices:", error);
      toast.error("Couldn't generate invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Status + fee-type only (class/student/date already applied in fetch).
  const filteredInvoices = invoices.filter((invoice) => {
    if (filter !== "all" && invoice.status !== filter) return false;
    if (feeTypeFilter && invoice.fee_structure_id !== feeTypeFilter)
      return false;
    return true;
  });
  const pageCount = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const paged = filteredInvoices.slice(pageStart, pageStart + PAGE_SIZE);

  const stats = {
    total: invoices.filter((i) => i.status !== "cancelled").length,
    pending: invoices.filter((i) => i.status === "pending").length,
    partial: invoices.filter((i) => i.status === "partial").length,
    paid: invoices.filter((i) => i.status === "paid").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
    cancelled: invoices.filter((i) => i.status === "cancelled").length,
    totalOutstanding: invoices
      .filter((i) => ["pending", "partial", "overdue"].includes(i.status))
      .reduce((sum, i) => sum + (i.amount_due - i.amount_paid), 0),
    totalCollected: invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.amount_paid, 0),
  };

  const exportToCSV = () => {
    if (filteredInvoices.length === 0) {
      toast.error("No invoices to export");
      return;
    }
    const headers = [
      "Invoice Number",
      "Student Number",
      "Student Name",
      "Fee Type",
      "Period",
      "Due Date",
      "Amount Due",
      "Amount Paid",
      "Outstanding",
      "Status",
    ];
    const rows = filteredInvoices.map((invoice) => [
      invoice.invoice_number,
      invoice.students?.student_number || "",
      `${invoice.students?.first_name || ""} ${invoice.students?.last_name || ""}`,
      invoice.fee_structures?.name || "",
      `${formatDate(invoice.period_start)} - ${formatDate(invoice.period_end)}`,
      formatDate(invoice.due_date),
      `£${invoice.amount_due.toFixed(2)}`,
      `£${invoice.amount_paid.toFixed(2)}`,
      `£${(invoice.amount_due - invoice.amount_paid).toFixed(2)}`,
      invoice.status,
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fee-invoices-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const statusChip = (status: string) =>
    status === "pending"
      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
      : status === "partial"
        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400"
        : status === "paid"
          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
          : status === "overdue"
            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
            : "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FinanceTabs active="fees" />
        <div className="flex items-center gap-3 self-start">
          <button
            onClick={generateInvoices}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Generate invoices</span>
          </button>
          <button
            onClick={exportToCSV}
            className="btn-outline flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7 md:gap-4">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Invoices</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
            {stats.pending}
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-500">Pending</p>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center dark:border-orange-800 dark:bg-orange-900/20">
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
            {stats.partial}
          </p>
          <p className="text-sm text-orange-600 dark:text-orange-500">Partial</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-900/20">
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.paid}
          </p>
          <p className="text-sm text-green-600 dark:text-green-500">Paid</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
            {stats.overdue}
          </p>
          <p className="text-sm text-red-600 dark:text-red-500">Overdue</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            £{stats.totalOutstanding.toFixed(2)}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-500">Outstanding</p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            £{stats.totalCollected.toFixed(2)}
          </p>
          <p className="text-sm text-primary">Collected</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6 md:gap-4">
          <div>
            <label className="form-label">Fee type</label>
            <select
              value={feeTypeFilter}
              onChange={(e) => setFeeTypeFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All fee types</option>
              {feeStructures.map((structure) => (
                <option key={structure.id} value={structure.id}>
                  {structure.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Class</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Student</label>
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All students</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} (#{s.student_number})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="form-label">From date</label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">To date</label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Invoices table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border bg-muted/50 px-4 py-3">
          <h3 className="font-semibold">
            Fee invoices ({filteredInvoices.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No invoices match these filters.
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="divide-y divide-border md:hidden">
              {paged.map((invoice) => {
                const outstanding = invoice.amount_due - invoice.amount_paid;
                const isOverdue =
                  invoice.status !== "paid" &&
                  invoice.status !== "cancelled" &&
                  new Date(invoice.due_date) < new Date();
                return (
                  <div key={invoice.id} className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {invoice.students?.first_name}{" "}
                          {invoice.students?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.students?.student_number}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${statusChip(invoice.status)}`}
                      >
                        {invoice.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{invoice.fee_structures?.name}</span>
                      <span>{invoice.invoice_number}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={
                          isOverdue
                            ? "font-medium text-red-600"
                            : "text-muted-foreground"
                        }
                      >
                        Due: {formatDate(invoice.due_date)}
                        {isOverdue ? " · overdue" : ""}
                      </span>
                      <span className="font-semibold">
                        £{invoice.amount_due.toFixed(2)}
                      </span>
                    </div>
                    {outstanding > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Outstanding: £{outstanding.toFixed(2)}
                      </p>
                    )}
                    {["pending", "partial", "overdue"].includes(
                      invoice.status,
                    ) && (
                      <div className="flex gap-3 pt-1">
                        <button
                          onClick={() =>
                            handleViewStudentInvoices({
                              id: invoice.student_id,
                              first_name: invoice.students?.first_name,
                              last_name: invoice.students?.last_name,
                              student_number: invoice.students?.student_number,
                            })
                          }
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Collect payment
                        </button>
                        <button
                          onClick={() => setCancelTarget(invoice.id)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {invoice.status === "paid" && (
                      <span className="text-xs text-green-600">✓ Paid</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Invoice</th>
                    <th className="px-4 py-2 text-left font-semibold">Student</th>
                    <th className="px-4 py-2 text-left font-semibold">Fee type</th>
                    <th className="px-4 py-2 text-left font-semibold">Period</th>
                    <th className="px-4 py-2 text-left font-semibold">Due date</th>
                    <th className="px-4 py-2 text-left font-semibold">Amount</th>
                    <th className="px-4 py-2 text-left font-semibold">Paid</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.map((invoice) => {
                    const outstanding = invoice.amount_due - invoice.amount_paid;
                    const isOverdue =
                      invoice.status !== "paid" &&
                      invoice.status !== "cancelled" &&
                      new Date(invoice.due_date) < new Date();
                    return (
                      <tr key={invoice.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(invoice.generated_date)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {invoice.students?.first_name}{" "}
                            {invoice.students?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {invoice.students?.student_number}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {invoice.fee_structures?.name}
                          </p>
                          <p className="text-xs capitalize text-muted-foreground">
                            {invoice.fee_structures?.frequency}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {invoice.period_name || (
                            <>
                              {formatDate(invoice.period_start)} –{" "}
                              {formatDate(invoice.period_end)}
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className={isOverdue ? "font-medium text-red-600" : ""}>
                            {formatDate(invoice.due_date)}
                          </p>
                          {isOverdue && (
                            <p className="text-xs text-red-500">Overdue</p>
                          )}
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          £{invoice.amount_due.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold">
                            £{invoice.amount_paid.toFixed(2)}
                          </p>
                          {outstanding > 0 && (
                            <p className="text-xs text-muted-foreground">
                              £{outstanding.toFixed(2)} due
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${statusChip(invoice.status)}`}
                          >
                            {invoice.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {["pending", "partial", "overdue"].includes(
                            invoice.status,
                          ) ? (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() =>
                                  handleViewStudentInvoices({
                                    id: invoice.student_id,
                                    first_name: invoice.students?.first_name,
                                    last_name: invoice.students?.last_name,
                                    student_number:
                                      invoice.students?.student_number,
                                  })
                                }
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                Collect payment
                              </button>
                              <button
                                onClick={() => setCancelTarget(invoice.id)}
                                className="text-xs font-medium text-red-600 hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : invoice.status === "paid" ? (
                            <span className="text-xs font-medium text-green-600">
                              ✓ Paid
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground">
                              Cancelled
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="border-t border-border px-4 py-3">
              <Pagination
                page={page}
                pageCount={pageCount}
                total={filteredInvoices.length}
                from={filteredInvoices.length === 0 ? 0 : pageStart + 1}
                to={Math.min(pageStart + PAGE_SIZE, filteredInvoices.length)}
                onPageChange={setPage}
                className="mt-0"
              />
            </div>
          </>
        )}
      </div>

      {selectedStudent && (
        <FeePaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          student={selectedStudent}
          invoices={outstandingInvoices}
          onSuccess={() => {
            fetchInvoices();
            setShowPaymentModal(false);
          }}
        />
      )}

      <ReasonDialog
        open={!!cancelTarget}
        title="Cancel this invoice?"
        message="The invoice will be marked cancelled and no longer counted as outstanding."
        label="Reason for cancelling"
        placeholder="e.g. duplicate, issued in error…"
        confirmText="Cancel invoice"
        destructive
        busy={cancelling}
        onCancel={() => setCancelTarget(null)}
        onConfirm={confirmCancel}
      />
    </div>
  );
}
