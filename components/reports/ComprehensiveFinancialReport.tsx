// components/reports/ComprehensiveFinancialReport.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, TrendingUp, DollarSign } from "lucide-react";

export default function ComprehensiveFinancialReport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewMode, setViewMode] = useState<"monthly" | "quarterly" | "yearly">(
    "monthly"
  );

  const supabase = createClient();

  const generateReport = async () => {
    setLoading(true);
    try {
      // Get fee invoices
      let feeQuery = supabase
        .from("fee_invoices")
        .select("amount_due, amount_paid, status, generated_date, paid_date");

      if (dateFrom) feeQuery = feeQuery.gte("generated_date", dateFrom);
      if (dateTo) feeQuery = feeQuery.lte("generated_date", dateTo);

      const { data: invoices } = await feeQuery;

      // Get fines
      let fineQuery = supabase
        .from("fines")
        .select("amount, status, issued_date, paid_date");

      if (dateFrom) fineQuery = fineQuery.gte("issued_date", dateFrom);
      if (dateTo) fineQuery = fineQuery.lte("issued_date", dateTo);

      const { data: fines } = await fineQuery;

      // Calculate totals
      const feeBilled =
        invoices?.reduce((sum, inv) => sum + inv.amount_due, 0) || 0;
      const feeCollected =
        invoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0;
      const feeOutstanding = feeBilled - feeCollected;

      const fineIssued = fines?.reduce((sum, f) => sum + f.amount, 0) || 0;
      const fineCollected =
        fines
          ?.filter((f) => f.status === "paid")
          .reduce((sum, f) => sum + f.amount, 0) || 0;
      const fineWaived =
        fines
          ?.filter((f) => f.status === "waived")
          .reduce((sum, f) => sum + f.amount, 0) || 0;
      const finePending =
        fines
          ?.filter((f) => f.status === "pending")
          .reduce((sum, f) => sum + f.amount, 0) || 0;

      const totalRevenue = feeCollected + fineCollected;
      const totalOutstanding = feeOutstanding + finePending;

      // Time period breakdown
      const periods: { [key: string]: any } = {};

      invoices?.forEach((inv) => {
        const period = getPeriodKey(inv.generated_date, viewMode);
        if (!periods[period]) {
          periods[period] = {
            feeBilled: 0,
            feeCollected: 0,
            fineIssued: 0,
            fineCollected: 0,
          };
        }
        periods[period].feeBilled += inv.amount_due;
        periods[period].feeCollected += inv.amount_paid;
      });

      fines?.forEach((fine) => {
        const period = getPeriodKey(fine.issued_date, viewMode);
        if (!periods[period]) {
          periods[period] = {
            feeBilled: 0,
            feeCollected: 0,
            fineIssued: 0,
            fineCollected: 0,
          };
        }
        periods[period].fineIssued += fine.amount;
        if (fine.status === "paid") {
          periods[period].fineCollected += fine.amount;
        }
      });

      setReportData({
        summary: {
          feeBilled,
          feeCollected,
          feeOutstanding,
          fineIssued,
          fineCollected,
          fineWaived,
          finePending,
          totalRevenue,
          totalOutstanding,
          feeCollectionRate:
            feeBilled > 0 ? Math.round((feeCollected / feeBilled) * 100) : 0,
          fineCollectionRate:
            fineIssued > 0 ? Math.round((fineCollected / fineIssued) * 100) : 0,
        },
        periods,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const getPeriodKey = (date: string, mode: string) => {
    const d = new Date(date);
    if (mode === "yearly") {
      return d.getFullYear().toString();
    } else if (mode === "quarterly") {
      const quarter = Math.floor(d.getMonth() / 3) + 1;
      return `${d.getFullYear()}-Q${quarter}`;
    } else {
      return date.slice(0, 7); // YYYY-MM
    }
  };

  const formatPeriod = (period: string, mode: string) => {
    if (mode === "yearly") return period;
    if (mode === "quarterly") return period;
    return new Date(period + "-01").toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const headers = [
      "Period",
      "Fee Billed",
      "Fee Collected",
      "Fine Issued",
      "Fine Collected",
      "Total Revenue",
    ];

    const rows = Object.entries(reportData.periods).map(
      ([period, data]: [string, any]) => [
        formatPeriod(period, viewMode),
        data.feeBilled.toFixed(2),
        data.feeCollected.toFixed(2),
        data.fineIssued.toFixed(2),
        data.fineCollected.toFixed(2),
        (data.feeCollected + data.fineCollected).toFixed(2),
      ]
    );

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
      "\n"
    );

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financial-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-muted/30 border border-border rounded-lg p-4">
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
            <label className="block text-sm font-medium mb-2">View Mode</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background"
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
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
          {/* Overall Summary */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">Financial Summary</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Revenue
                </p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  £{reportData.summary.totalRevenue.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Outstanding
                </p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  £{reportData.summary.totalOutstanding.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Fee Collection
                </p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {reportData.summary.feeCollectionRate}%
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Fine Collection
                </p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {reportData.summary.fineCollectionRate}%
                </p>
              </div>
            </div>
          </div>

          {/* Fee vs Fine Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fees */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold mb-4">Fee Revenue</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Billed</span>
                  <span className="font-semibold">
                    £{reportData.summary.feeBilled.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Collected
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    £{reportData.summary.feeCollected.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Outstanding
                  </span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    £{reportData.summary.feeOutstanding.toFixed(2)}
                  </span>
                </div>
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Collection Rate</span>
                    <span className="text-lg font-bold text-primary">
                      {reportData.summary.feeCollectionRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fines */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h4 className="font-semibold mb-4">Fine Revenue</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Issued</span>
                  <span className="font-semibold">
                    £{reportData.summary.fineIssued.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Collected
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    £{reportData.summary.fineCollected.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Waived</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    £{reportData.summary.fineWaived.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    £{reportData.summary.finePending.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Period Breakdown */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">
                {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} Trend
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Period</th>
                    <th className="text-right p-3">Fee Collected</th>
                    <th className="text-right p-3">Fine Collected</th>
                    <th className="text-right p-3">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Object.entries(reportData.periods)
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([period, data]: [string, any]) => {
                      const totalRevenue =
                        data.feeCollected + data.fineCollected;
                      return (
                        <tr key={period} className="hover:bg-accent">
                          <td className="p-3 font-medium">
                            {formatPeriod(period, viewMode)}
                          </td>
                          <td className="p-3 text-right">
                            £{data.feeCollected.toFixed(2)}
                          </td>
                          <td className="p-3 text-right">
                            £{data.fineCollected.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-semibold text-primary">
                            £{totalRevenue.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
