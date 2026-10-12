// components/dashboard/FinancialOverview.tsx
import { createClient } from "@/lib/supabase/server";
import {
  PoundSterling,
  TrendingUp,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

export default async function FinancialOverview() {
  const supabase = await createClient();

  // Get all fee invoices
  const { data: allInvoices } = await supabase
    .from("fee_invoices")
    .select("amount_due, amount_paid, status");

  // Get all fines
  const { data: allFines } = await supabase
    .from("fines")
    .select("amount, status");

  // Calculate metrics
  const totalRevenue =
    allInvoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0;

  const outstandingFees =
    allInvoices
      ?.filter((inv) => ["pending", "partial", "overdue"].includes(inv.status))
      .reduce((sum, inv) => sum + (inv.amount_due - inv.amount_paid), 0) || 0;

  const paidFines =
    allFines
      ?.filter((f) => f.status === "paid")
      .reduce((sum, f) => sum + f.amount, 0) || 0;

  const outstandingFines =
    allFines
      ?.filter((f) => f.status === "pending")
      .reduce((sum, f) => sum + f.amount, 0) || 0;

  const totalCollected = totalRevenue + paidFines;
  const totalOutstanding = outstandingFees + outstandingFines;

  // Collection rate
  const totalBilled = totalCollected + totalOutstanding;
  const collectionRate =
    totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Get this month's revenue. Month boundaries computed properly (the old
  // code asked for the 31st of every month, which Postgres rejects), and fee
  // income comes from fee_payments (the actual money-received table) because
  // fee_invoices has no paid_date column.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
  const { data: monthInvoices } = await supabase
    .from("fee_payments")
    .select("amount, payment_date")
    .gte("payment_date", monthStart)
    .lte("payment_date", monthEnd);

  const { data: monthFines } = await supabase
    .from("fines")
    .select("amount, paid_date")
    .eq("status", "paid")
    .not("paid_date", "is", null)
    .gte("paid_date", monthStart)
    .lte("paid_date", monthEnd);

  const monthlyRevenue =
    (monthInvoices?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0) +
    (monthFines?.reduce((sum, f) => sum + f.amount, 0) || 0);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Financial overview</h3>
        <Link href="/fees" className="text-sm text-primary hover:underline">
          View details →
        </Link>
      </div>

      {/* Main stats — neutral cards; colour only where it carries meaning */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total collected */}
        <div className="p-4 rounded-lg border border-border bg-muted/40">
          <div className="flex items-center gap-2 mb-2">
            <PoundSterling className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground">
              Total collected
            </p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            £{totalCollected.toFixed(2)}
          </p>
        </div>

        {/* This month */}
        <div className="p-4 rounded-lg border border-border bg-muted/40">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground">
              This month
            </p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            £{monthlyRevenue.toFixed(2)}
          </p>
        </div>

        {/* Outstanding */}
        <div className="p-4 rounded-lg border border-border bg-muted/40">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-danger" />
            <p className="text-xs font-medium text-muted-foreground">
              Outstanding
            </p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-danger">
            £{totalOutstanding.toFixed(2)}
          </p>
        </div>

        {/* Collection rate */}
        <div className="p-4 rounded-lg border border-border bg-muted/40">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <p className="text-xs font-medium text-muted-foreground">
              Collection rate
            </p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {collectionRate}%
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Fee Revenue</p>
          <p className="text-lg font-semibold">£{totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-danger mt-1">
            Outstanding: £{outstandingFees.toFixed(2)}
          </p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Fine Revenue</p>
          <p className="text-lg font-semibold">£{paidFines.toFixed(2)}</p>
          <p className="text-xs text-danger mt-1">
            Uncollected: £{outstandingFines.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
