// components/reports/FineCollectionReport.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, Filter } from "lucide-react";

interface FineCollectionReportProps {
  classes: Array<{ id: string; name: string }>;
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  }>;
}

export default function FineCollectionReport({
  classes,
  students,
}: FineCollectionReportProps) {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fineTypeFilter, setFineTypeFilter] = useState("all");

  const supabase = createClient();

  const generateReport = async () => {
    setLoading(true);
    try {
      // Build query
      let query = supabase
        .from("fines")
        .select(
          `
          *,
          students (
            id,
            first_name,
            last_name,
            student_number,
            class_id
          )
        `
        )
        .order("issued_date", { ascending: false });

      // Apply date filters
      if (dateFrom) {
        query = query.gte("issued_date", dateFrom);
      }
      if (dateTo) {
        query = query.lte("issued_date", dateTo);
      }

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Apply fine type filter
      if (fineTypeFilter !== "all") {
        query = query.eq("fine_type", fineTypeFilter);
      }

      const { data: fines, error } = await query;

      if (error) throw error;

      // Filter by class (client-side)
      let filteredFines = fines || [];
      if (classFilter) {
        filteredFines = filteredFines.filter(
          (fine) => fine.students?.class_id === classFilter
        );
      }

      // Calculate metrics
      const totalFines = filteredFines.length;
      const totalAmount = filteredFines.reduce(
        (sum, fine) => sum + fine.amount,
        0
      );

      const paidFines = filteredFines.filter((f) => f.status === "paid");
      const pendingFines = filteredFines.filter((f) => f.status === "pending");
      const waivedFines = filteredFines.filter((f) => f.status === "waived");

      const totalCollected = paidFines.reduce(
        (sum, fine) => sum + fine.amount,
        0
      );
      const totalPending = pendingFines.reduce(
        (sum, fine) => sum + fine.amount,
        0
      );
      const totalWaived = waivedFines.reduce(
        (sum, fine) => sum + fine.amount,
        0
      );

      const collectionRate =
        totalAmount > 0 ? Math.round((totalCollected / totalAmount) * 100) : 0;

      // Group by fine type
      const byType: { [key: string]: any } = {};
      filteredFines.forEach((fine) => {
        const type = fine.fine_type;
        if (!byType[type]) {
          byType[type] = {
            count: 0,
            total: 0,
            collected: 0,
            pending: 0,
            waived: 0,
          };
        }
        byType[type].count++;
        byType[type].total += fine.amount;
        if (fine.status === "paid") byType[type].collected += fine.amount;
        if (fine.status === "pending") byType[type].pending += fine.amount;
        if (fine.status === "waived") byType[type].waived += fine.amount;
      });

      // Group by month
      const byMonth: { [key: string]: any } = {};
      filteredFines.forEach((fine) => {
        const month = fine.issued_date.slice(0, 7);
        if (!byMonth[month]) {
          byMonth[month] = { count: 0, issued: 0, collected: 0 };
        }
        byMonth[month].count++;
        byMonth[month].issued += fine.amount;
        if (fine.status === "paid") byMonth[month].collected += fine.amount;
      });

      setReportData({
        fines: filteredFines,
        summary: {
          totalFines,
          totalAmount,
          totalCollected,
          totalPending,
          totalWaived,
          paidCount: paidFines.length,
          pendingCount: pendingFines.length,
          waivedCount: waivedFines.length,
          collectionRate,
        },
        byType,
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
      "Student Number",
      "Student Name",
      "Fine Type",
      "Amount",
      "Status",
      "Issued Date",
      "Paid Date",
      "Payment Method",
      "Notes",
    ];

    const rows = reportData.fines.map((fine: any) => [
      fine.students?.student_number || "",
      `${fine.students?.first_name || ""} ${fine.students?.last_name || ""}`,
      fine.fine_type,
      fine.amount.toFixed(2),
      fine.status,
      fine.issued_date,
      fine.paid_date || "",
      fine.payment_method || "",
      fine.notes || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row: any[]) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fine-collection-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

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
              <option value="paid">Paid</option>
              <option value="waived">Waived</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Fine Type</label>
            <select
              value={fineTypeFilter}
              onChange={(e) => setFineTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            >
              <option value="all">All Types</option>
              <option value="late">Late Arrival</option>
              <option value="absent">Absence</option>
              <option value="behavior">Behavior</option>
              <option value="other">Other</option>
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
              <p className="text-sm text-muted-foreground mb-1">Total Fines</p>
              <p className="text-2xl font-bold">
                {reportData.summary.totalFines}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                £{reportData.summary.totalAmount.toFixed(2)}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Collected</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                £{reportData.summary.totalCollected.toFixed(2)}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                £{reportData.summary.totalPending.toFixed(2)}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Paid</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {reportData.summary.paidCount}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Uncollected</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {reportData.summary.pendingCount}
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-1">Waived</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {reportData.summary.waivedCount}
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

          {/* By Fine Type */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="font-semibold mb-4">Breakdown by Fine Type</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Fine Type</th>
                    <th className="text-center p-3">Count</th>
                    <th className="text-right p-3">Total</th>
                    <th className="text-right p-3">Collected</th>
                    <th className="text-right p-3">Pending</th>
                    <th className="text-right p-3">Waived</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(reportData.byType).map(
                    ([type, data]: [string, any]) => (
                      <tr key={type} className="hover:bg-accent">
                        <td className="p-3 font-medium capitalize">{type}</td>
                        <td className="p-3 text-center">{data.count}</td>
                        <td className="p-3 text-right">
                          £{data.total.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-green-600 dark:text-green-400">
                          £{data.collected.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-red-600 dark:text-red-400">
                          £{data.pending.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-blue-600 dark:text-blue-400">
                          £{data.waived.toFixed(2)}
                        </td>
                      </tr>
                    )
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
                    <th className="text-center p-3">Fines</th>
                    <th className="text-right p-3">Issued</th>
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
                          £{data.issued.toFixed(2)}
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
