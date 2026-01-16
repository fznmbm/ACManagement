// components/dashboard/FinancialOverview.tsx
import { createClient } from "@/lib/supabase/server";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
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

  // Get this month's revenue
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const { data: monthInvoices } = await supabase
    .from("fee_invoices")
    .select("amount_paid, paid_date")
    .not("paid_date", "is", null)
    .gte("paid_date", `${currentMonth}-01`)
    .lte("paid_date", `${currentMonth}-31`);

  const { data: monthFines } = await supabase
    .from("fines")
    .select("amount, paid_date")
    .eq("status", "paid")
    .not("paid_date", "is", null)
    .gte("paid_date", `${currentMonth}-01`)
    .lte("paid_date", `${currentMonth}-31`);

  const monthlyRevenue =
    (monthInvoices?.reduce((sum, inv) => sum + inv.amount_paid, 0) || 0) +
    (monthFines?.reduce((sum, f) => sum + f.amount, 0) || 0);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Financial Overview</h3>
        <Link href="/fees" className="text-sm text-primary hover:underline">
          View Details →
        </Link>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Collected */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            <p className="text-xs font-medium text-green-700 dark:text-green-300">
              Total Collected
            </p>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            £{totalCollected.toFixed(2)}
          </p>
        </div>

        {/* Monthly Revenue */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
              This Month
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            £{monthlyRevenue.toFixed(2)}
          </p>
        </div>

        {/* Outstanding */}
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <p className="text-xs font-medium text-red-700 dark:text-red-300">
              Outstanding
            </p>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            £{totalOutstanding.toFixed(2)}
          </p>
        </div>

        {/* Collection Rate */}
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
              Collection Rate
            </p>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {collectionRate}%
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Fee Revenue</p>
          <p className="text-lg font-semibold">£{totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Outstanding: £{outstandingFees.toFixed(2)}
          </p>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Fine Revenue</p>
          <p className="text-lg font-semibold">£{paidFines.toFixed(2)}</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Uncollected: £{outstandingFines.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
