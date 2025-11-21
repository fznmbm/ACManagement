"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, Plus, Settings, Receipt } from "lucide-react";
import FeePaymentModal from "@/components/fees/FeePaymentModal";
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

export default function FeesPage() {
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(
    null
  );
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [outstandingInvoices, setOutstandingInvoices] = useState<FeeInvoice[]>(
    []
  );

  // Filters
  const [classFilter, setClassFilter] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [feeTypeFilter, setFeeTypeFilter] = useState("");

  const [students, setStudents] = useState<
    {
      id: string;
      first_name: string;
      last_name: string;
      student_number: string;
    }[]
  >([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchInvoices();
    fetchFeeStructures();
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  // Add this NEW useEffect (runs when filters change)
  useEffect(() => {
    fetchInvoices();
  }, [classFilter, studentFilter, dateFromFilter, dateToFilter]);

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
          `
          *,
          students (first_name, last_name, student_number,  class_id, status),
          fee_structures (name, frequency)
        `
        )
        .order("due_date", { ascending: false });

      if (error) throw error;

      // Apply class filter client-side after the database query
      let filteredData = data || [];

      if (classFilter) {
        filteredData = filteredData.filter(
          (invoice) => invoice.students?.class_id === classFilter
        );
      }

      if (studentFilter) {
        filteredData = filteredData.filter(
          (invoice) => invoice.student_id === studentFilter
        );
      }

      if (dateFromFilter) {
        filteredData = filteredData.filter(
          (invoice) => invoice.due_date >= dateFromFilter
        );
      }

      if (dateToFilter) {
        filteredData = filteredData.filter(
          (invoice) => invoice.due_date <= dateToFilter
        );
      }

      setInvoices(filteredData);
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
        .select(
          `
          *,
          fee_structures (name, frequency)
        `
        )
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

  const handleCancelInvoice = async (invoiceId: string) => {
    if (!confirm("Cancel this invoice? This action cannot be undone.")) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("fee_invoices")
        .update({
          status: "cancelled",
          notes: "Cancelled by admin",
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);

      if (error) throw error;

      fetchInvoices(); // Refresh the list
      alert("Invoice cancelled successfully");
    } catch (error) {
      console.error("Error cancelling invoice:", error);
      alert("Failed to cancel invoice");
    }
  };

  const generateInvoices = async () => {
    if (
      !confirm(
        "Generate new invoices for all active fee structures? This may take a moment."
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      // Call your invoice generation function
      const response = await fetch("/api/fees/generate-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to generate invoices");

      const result = await response.json();
      alert(`Successfully generated ${result.count} invoices`);
      fetchInvoices();
    } catch (error) {
      console.error("Error generating invoices:", error);
      alert("Failed to generate invoices");
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    if (filter !== "all" && invoice.status !== filter) return false;
    if (feeTypeFilter && invoice.fee_structure_id !== feeTypeFilter)
      return false;
    if (
      studentFilter &&
      !`${invoice.students?.first_name} ${invoice.students?.last_name}`
        .toLowerCase()
        .includes(studentFilter.toLowerCase())
    )
      return false;
    if (dateFromFilter && invoice.due_date < dateFromFilter) return false;
    if (dateToFilter && invoice.due_date > dateToFilter) return false;
    return true;
  });

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
      `${invoice.students?.first_name || ""} ${
        invoice.students?.last_name || ""
      }`,
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fee Management</h1>
          <p className="text-muted-foreground">
            Manage student fees, invoices, and payments
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={generateInvoices}
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Generate Invoices</span>
          </button>
          <button
            onClick={exportToCSV}
            className="btn-outline flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total Invoices</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
            {stats.pending}
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-500">
            Pending
          </p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
            {stats.partial}
          </p>
          <p className="text-sm text-orange-600 dark:text-orange-500">
            Partial
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.paid}
          </p>
          <p className="text-sm text-green-600 dark:text-green-500">Paid</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
            {stats.overdue}
          </p>
          <p className="text-sm text-red-600 dark:text-red-500">Overdue</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            £{stats.totalOutstanding.toFixed(2)}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-500">
            Outstanding
          </p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            £{stats.totalCollected.toFixed(2)}
          </p>
          <p className="text-sm text-primary">Collected</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-400">
            {stats.cancelled}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-500">Cancelled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="form-label">Fee Type</label>
            <select
              value={feeTypeFilter}
              onChange={(e) => setFeeTypeFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All Fee Types</option>
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
              <option value="">All Classes</option>
              {classes.map((cls: any) => (
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
              <option value="">All Students</option>
              {students.map((student: any) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} (#
                  {student.student_number})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">From Date</label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/50">
          <h3 className="font-semibold">
            Fee Invoices ({filteredInvoices.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Invoice</th>
                <th className="px-4 py-2 text-left font-semibold">Student</th>
                <th className="px-4 py-2 text-left font-semibold">Fee Type</th>
                <th className="px-4 py-2 text-left font-semibold">Period</th>
                <th className="px-4 py-2 text-left font-semibold">Due Date</th>
                <th className="px-4 py-2 text-left font-semibold">Amount</th>
                <th className="px-4 py-2 text-left font-semibold">Paid</th>
                <th className="px-4 py-2 text-left font-semibold">Status</th>
                <th className="px-4 py-2 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInvoices.map((invoice) => {
                const outstanding = invoice.amount_due - invoice.amount_paid;
                const isOverdue = new Date(invoice.due_date) < new Date();

                return (
                  <tr key={invoice.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(invoice.generated_date)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">
                          {invoice.students?.first_name}{" "}
                          {invoice.students?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.students?.student_number}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">
                          {invoice.fee_structures?.name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {invoice.fee_structures?.frequency}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <p>{invoice.period_name}</p>
                        <p>({formatDate(invoice.period_start)}</p>
                        <p>to {formatDate(invoice.period_end)})</p>
                        {/* <p>
                          {invoice.period_name ||
                            `${formatDate(
                              invoice.period_start
                            )} to ${formatDate(invoice.period_end)}`}
                        </p> */}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p
                          className={
                            isOverdue ? "text-red-600 font-medium" : ""
                          }
                        >
                          {formatDate(invoice.due_date)}
                        </p>
                        {isOverdue && (
                          <p className="text-xs text-red-500">OVERDUE</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      £{invoice.amount_due.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold">
                          £{invoice.amount_paid.toFixed(2)}
                        </p>
                        {outstanding > 0 && (
                          <p className="text-xs text-muted-foreground">
                            £{outstanding.toFixed(2)} due
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          invoice.status === "pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                            : invoice.status === "partial"
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400"
                            : invoice.status === "paid"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                            : invoice.status === "overdue"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                            : "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {["pending", "partial", "overdue"].includes(
                          invoice.status
                        ) && (
                          <>
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
                              className="text-primary hover:underline text-xs"
                            >
                              Collect Payment
                            </button>
                            <button
                              onClick={() => handleCancelInvoice(invoice.id)}
                              className="text-red-600 hover:underline text-xs"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {invoice.status === "paid" && (
                          <span className="text-green-600 text-xs font-medium">
                            ✓ Paid
                          </span>
                        )}
                        {invoice.status === "cancelled" && (
                          <span className="text-gray-500 text-xs font-medium">
                            Cancelled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee Payment Modal */}
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
    </div>
  );
}
