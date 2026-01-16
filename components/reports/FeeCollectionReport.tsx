// components/reports/FeeCollectionReport.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, Calendar, Filter } from "lucide-react";

interface FeeCollectionReportProps {
  classes: Array<{ id: string; name: string }>;
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  }>;
}

export default function FeeCollectionReport({
  classes,
  students,
}: FeeCollectionReportProps) {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feeTypeFilter, setFeeTypeFilter] = useState("");

  const supabase = createClient();

  const generateReport = async () => {
    setLoading(true);
    try {
      // Build query
      let query = supabase
        .from("fee_invoices")
        .select(
          `
          *,
          students (
            id,
            first_name,
            last_name,
            student_number,
            class_id
          ),
          fee_structures (name, frequency)
        `
        )
        .order("generated_date", { ascending: false });

      // Apply date filters
      if (dateFrom) {
        query = query.gte("generated_date", dateFrom);
      }
      if (dateTo) {
        query = query.lte("generated_date", dateTo);
      }

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Apply fee type filter
      if (feeTypeFilter) {
        query = query.eq("fee_structure_id", feeTypeFilter);
      }

      const { data: invoices, error } = await query;

      if (error) throw error;

      // Filter by class (client-side since students table)
      let filteredInvoices = invoices || [];
      if (classFilter) {
        filteredInvoices = filteredInvoices.filter(
          (inv) => inv.students?.class_id === classFilter
        );
      }

      // Calculate metrics
      const totalInvoices = filteredInvoices.length;
      const totalBilled = filteredInvoices.reduce(
        (sum, inv) => sum + inv.amount_due,
        0
      );
      const totalCollected = filteredInvoices.reduce(
        (sum, inv) => sum + inv.amount_paid,
        0
      );
      const totalOutstanding = filteredInvoices.reduce(
        (sum, inv) => sum + (inv.amount_due - inv.amount_paid),
        0
      );

      const paidInvoices = filteredInvoices.filter(
        (i) => i.status === "paid"
      ).length;
      const pendingInvoices = filteredInvoices.filter(
        (i) => i.status === "pending"
      ).length;
      const partialInvoices = filteredInvoices.filter(
        (i) => i.status === "partial"
      ).length;
      const overdueInvoices = filteredInvoices.filter(
        (i) => i.status === "overdue"
      ).length;

      const collectionRate =
        totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

      // Group by fee type
      const byFeeType: { [key: string]: any } = {};
      filteredInvoices.forEach((inv) => {
        const feeName = inv.fee_structures?.name || "Unknown";
        if (!byFeeType[feeName]) {
          byFeeType[feeName] = {
            count: 0,
            billed: 0,
            collected: 0,
            outstanding: 0,
          };
        }
        byFeeType[feeName].count++;
        byFeeType[feeName].billed += inv.amount_due;
        byFeeType[feeName].collected += inv.amount_paid;
        byFeeType[feeName].outstanding += inv.amount_due - inv.amount_paid;
      });

      // Group by month
      const byMonth: { [key: string]: any } = {};
      filteredInvoices.forEach((inv) => {
        const month = inv.generated_date.slice(0, 7); // YYYY-MM
        if (!byMonth[month]) {
          byMonth[month] = { billed: 0, collected: 0, count: 0 };
        }
        byMonth[month].count++;
        byMonth[month].billed += inv.amount_due;
        byMonth[month].collected += inv.amount_paid;
      });

      setReportData({
        invoices: filteredInvoices,
        summary: {
          totalInvoices,
          totalBilled,
          totalCollected,
          totalOutstanding,
          paidInvoices,
          pendingInvoices,
          partialInvoices,
          overdueInvoices,
          collectionRate,
        },
        byFeeType,
        byMonth,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const headers = [
      "Invoice Number",
      "Student Number",
      "Student Name",
      "Fee Type",
      "Frequency",
      "Period Start",
      "Period End",
      "Due Date",
      "Amount Due",
      "Amount Paid",
      "Outstanding",
      "Status",
    ];

    const rows = reportData.invoices.map((inv: any) => [
      inv.invoice_number,
      inv.students?.student_number || "",
      `${inv.students?.first_name || ""} ${inv.students?.last_name || ""}`,
      inv.fee_structures?.name || "",
      inv.fee_structures?.frequency || "",
      inv.period_start,
      inv.period_end,
      inv.due_date,
      inv.amount_due.toFixed(2),
      inv.amount_paid.toFixed(2),
      (inv.amount_due - inv.amount_paid).toFixed(2),
      inv.status,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row: any[]) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fee-collection-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  // Get unique fee types for filter
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  useState(() => {
    const fetchFeeTypes = async () => {
      const { data } = await supabase
        .from("fee_structures")
        .select("id, name")
        .order("name");
      setFeeTypes(data || []);
    };
    fetchFeeTypes();
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4" />
          <h4 className="font-semibold">Filters</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Class</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fee Type</label>
            <select
              value={feeTypeFilter}
              onChange={(e) => setFeeTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            >
              <option value="">All Fee Types</option>
              {feeTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={generateReport}
            disabled={loading}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>

          {reportData && (
            <button
              onClick={exportToCSV}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">
                Total Invoices
              </p>
              <p className="text-2xl font-bold">
                {reportData.summary.totalInvoices}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Billed</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                £{reportData.summary.totalBilled.toFixed(2)}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">
                Total Collected
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                £{reportData.summary.totalCollected.toFixed(2)}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Outstanding</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                £{reportData.summary.totalOutstanding.toFixed(2)}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Paid</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {reportData.summary.paidInvoices}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {reportData.summary.pendingInvoices}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Overdue</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {reportData.summary.overdueInvoices}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">
                Collection Rate
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {reportData.summary.collectionRate}%
              </p>
            </div>
          </div>

          {/* By Fee Type */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold mb-4">Breakdown by Fee Type</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Fee Type</th>
                    <th className="text-center p-3">Invoices</th>
                    <th className="text-right p-3">Billed</th>
                    <th className="text-right p-3">Collected</th>
                    <th className="text-right p-3">Outstanding</th>
                    <th className="text-center p-3">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(reportData.byFeeType).map(
                    ([type, data]: [string, any]) => {
                      const rate =
                        data.billed > 0
                          ? Math.round((data.collected / data.billed) * 100)
                          : 0;
                      return (
                        <tr key={type} className="hover:bg-accent">
                          <td className="p-3 font-medium">{type}</td>
                          <td className="p-3 text-center">{data.count}</td>
                          <td className="p-3 text-right">
                            £{data.billed.toFixed(2)}
                          </td>
                          <td className="p-3 text-right text-green-600 dark:text-green-400">
                            £{data.collected.toFixed(2)}
                          </td>
                          <td className="p-3 text-right text-red-600 dark:text-red-400">
                            £{data.outstanding.toFixed(2)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                rate >= 90
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                  : rate >= 70
                                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                              }`}
                            >
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* By Month */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold mb-4">Monthly Trend</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Month</th>
                    <th className="text-center p-3">Invoices</th>
                    <th className="text-right p-3">Billed</th>
                    <th className="text-right p-3">Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(reportData.byMonth)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([month, data]: [string, any]) => (
                      <tr key={month} className="hover:bg-accent">
                        <td className="p-3 font-medium">
                          {new Date(month + "-01").toLocaleDateString("en-GB", {
                            month: "long",
                            year: "numeric",
                          })}
                        </td>
                        <td className="p-3 text-center">{data.count}</td>
                        <td className="p-3 text-right">
                          £{data.billed.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-green-600 dark:text-green-400">
                          £{data.collected.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
