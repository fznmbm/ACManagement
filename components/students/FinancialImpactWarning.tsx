import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, DollarSign, FileText, UserX } from "lucide-react";

interface FinancialImpactWarningProps {
  studentId: string;
  actionType: "status_change" | "deletion";
  newStatus?: string;
}

interface FinancialImpact {
  unpaidInvoices: number;
  unpaidAmount: number;
  activeAssignments: number;
  monthlyCommitment: number;
  pendingFines: number;
  finesAmount: number;
}

export default function FinancialImpactWarning({
  studentId,
  actionType,
  newStatus,
}: FinancialImpactWarningProps) {
  const [impact, setImpact] = useState<FinancialImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    calculateFinancialImpact();
  }, [studentId]);

  const calculateFinancialImpact = async () => {
    try {
      setLoading(true);

      // Get unpaid invoices
      const { data: invoices } = await supabase
        .from("fee_invoices")
        .select("*")
        .eq("student_id", studentId)
        .in("status", ["pending", "partial", "overdue"]);

      // Get active fee assignments
      const { data: assignments } = await supabase
        .from("student_fee_assignments")
        .select("*, fee_structures(*)")
        .eq("student_id", studentId)
        .eq("is_active", true);

      // Get pending fines
      const { data: fines } = await supabase
        .from("fines")
        .select("*")
        .eq("student_id", studentId)
        .eq("status", "pending");

      const unpaidAmount =
        invoices?.reduce(
          (sum, inv) => sum + (inv.amount_due - inv.amount_paid),
          0
        ) || 0;

      const monthlyCommitment =
        assignments
          ?.filter((a) => a.fee_structures.frequency === "monthly")
          .reduce((sum, a) => sum + a.fee_structures.amount, 0) || 0;

      const finesAmount =
        fines?.reduce((sum, fine) => sum + fine.amount, 0) || 0;

      setImpact({
        unpaidInvoices: invoices?.length || 0,
        unpaidAmount,
        activeAssignments: assignments?.length || 0,
        monthlyCommitment,
        pendingFines: fines?.length || 0,
        finesAmount,
      });
    } catch (error) {
      console.error("Error calculating financial impact:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900/20 border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          Calculating financial impact...
        </p>
      </div>
    );
  }

  if (!impact) return null;

  const hasFinancialRecords =
    impact.unpaidInvoices > 0 ||
    impact.activeAssignments > 0 ||
    impact.pendingFines > 0;

  if (!hasFinancialRecords) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-green-800 dark:text-green-400">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <p className="font-medium text-sm">No financial records found</p>
        </div>
        <p className="text-sm text-green-700 dark:text-green-500 mt-1">
          Safe to proceed with{" "}
          {actionType === "deletion" ? "deletion" : "status change"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
          Financial Impact Warning
        </h4>
      </div>

      <div className="space-y-3">
        {impact.unpaidInvoices > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                Unpaid Invoices
              </span>
            </div>
            <span className="font-medium text-yellow-800 dark:text-yellow-200">
              {impact.unpaidInvoices} (£{impact.unpaidAmount.toFixed(2)})
            </span>
          </div>
        )}

        {impact.activeAssignments > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                Active Fee Assignments
              </span>
            </div>
            <span className="font-medium text-yellow-800 dark:text-yellow-200">
              {impact.activeAssignments} assignments
            </span>
          </div>
        )}

        {impact.monthlyCommitment > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                Monthly Commitment
              </span>
            </div>
            <span className="font-medium text-yellow-800 dark:text-yellow-200">
              £{impact.monthlyCommitment.toFixed(2)}/month
            </span>
          </div>
        )}

        {impact.pendingFines > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700 dark:text-yellow-300">
                Pending Fines
              </span>
            </div>
            <span className="font-medium text-yellow-800 dark:text-yellow-200">
              {impact.pendingFines} (£{impact.finesAmount.toFixed(2)})
            </span>
          </div>
        )}

        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded border border-yellow-300 dark:border-yellow-700">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
            What will happen:
          </p>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 space-y-1">
            {actionType === "deletion" ? (
              <>
                <li>• Unpaid invoices will be cancelled</li>
                <li>• Active fee assignments will be ended</li>
                <li>• Pending fines will be cancelled</li>
                <li>• Paid invoices and payment history will be preserved</li>
              </>
            ) : (
              <>
                {newStatus === "withdrawn" && (
                  <li>• Future invoices will be cancelled</li>
                )}
                {["inactive", "withdrawn", "graduated"].includes(
                  newStatus || ""
                ) && <li>• Active fee assignments will be ended</li>}
                <li>• Existing unpaid invoices will remain for collection</li>
                <li>• All payment history will be preserved</li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
