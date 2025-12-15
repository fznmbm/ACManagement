"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils/helpers";
import Link from "next/link";

interface StudentFeeHistoryProps {
  studentId: string;
}

export default function StudentFeeHistory({
  studentId,
}: StudentFeeHistoryProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchInvoices();
  }, [studentId]);

  const fetchInvoices = async () => {
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
        .order("due_date", { ascending: false })
        .limit(5);

      if (!error) {
        setInvoices(data || []);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  const pendingInvoices = invoices.filter((inv) =>
    ["pending", "partial", "overdue"].includes(inv.status)
  );
  const outstandingAmount = pendingInvoices.reduce(
    (sum, inv) => sum + (inv.amount_due - inv.amount_paid),
    0
  );

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Fee Status</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Fee Status</h3>

      {/* Outstanding Summary */}
      {outstandingAmount > 0 ? (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-orange-800 dark:text-orange-200">
                Outstanding Fees
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {pendingInvoices.length} invoice
                {pendingInvoices.length !== 1 ? "s" : ""} pending
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                £{outstandingAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* ADD QUICK ACTION BUTTONS HERE */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => (window.location.href = "/fees")}
              className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
            >
              Collect Payment
            </button>
            <button
              onClick={() => {
                if (
                  confirm(
                    `Waive £${outstandingAmount.toFixed(
                      2
                    )} in outstanding fees?`
                  )
                ) {
                  // Add waive logic here
                  alert("Waive functionality - to be implemented");
                }
              }}
              className="px-3 py-1 border border-orange-600 text-orange-600 rounded text-sm hover:bg-orange-50"
            >
              Waive Outstanding
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
          <p className="text-green-800 dark:text-green-200 font-medium">
            ✓ All fees up to date
          </p>
        </div>
      )}

      {/* Recent Invoices */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Recent Invoices</h4>
        {invoices.length > 0 ? (
          <div className="space-y-2">
            {invoices.slice(0, 3).map((invoice: any) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div>
                  <p className="font-medium text-sm">
                    {invoice.fee_structures?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Due: {formatDate(invoice.due_date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    £{invoice.amount_due.toFixed(2)}
                  </p>
                  <span
                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                      invoice.status === "paid"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                        : invoice.status === "pending"
                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                    }`}
                  >
                    {invoice.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No invoices generated yet.
          </p>
        )}

        <div className="mt-3">
          <Link href="/fees" className="text-sm text-primary hover:underline">
            View all fee history →
          </Link>
        </div>
      </div>
    </div>
  );
}
