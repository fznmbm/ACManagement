"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Receipt, CheckCircle, AlertTriangle } from "lucide-react";
import { FeeInvoice, StudentData } from "@/types/fees";

interface FeePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentData;
  invoices: FeeInvoice[];
  onSuccess?: () => void;
}

export default function FeePaymentModal({
  isOpen,
  onClose,
  student,
  invoices,
  onSuccess,
}: FeePaymentModalProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>(
    {}
  );
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  if (!isOpen) return null;

  const outstandingInvoices = invoices.filter(
    (invoice) => invoice !== undefined
  );

  const calculateTotal = () => {
    return selectedInvoices.reduce((sum, invoiceId) => {
      const amount = parseFloat(paymentAmounts[invoiceId] || "0");
      return sum + amount;
    }, 0);
  };

  const handleSelectAll = () => {
    if (selectedInvoices.length === outstandingInvoices.length) {
      setSelectedInvoices([]);
      setPaymentAmounts({});
    } else {
      const allIds = outstandingInvoices.map((inv) => inv.id);
      setSelectedInvoices(allIds);

      const amounts: Record<string, string> = {};
      outstandingInvoices.forEach((invoice) => {
        const outstanding = invoice.amount_due - invoice.amount_paid;
        amounts[invoice.id] = outstanding.toFixed(2);
      });
      setPaymentAmounts(amounts);
    }
  };

  const handleInvoiceToggle = (invoiceId: string) => {
    const invoice = outstandingInvoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    if (selectedInvoices.includes(invoiceId)) {
      setSelectedInvoices((prev) => prev.filter((id) => id !== invoiceId));
      setPaymentAmounts((prev) => {
        const newAmounts = { ...prev };
        delete newAmounts[invoiceId];
        return newAmounts;
      });
    } else {
      setSelectedInvoices((prev) => [...prev, invoiceId]);
      const outstanding = invoice.amount_due - invoice.amount_paid;
      setPaymentAmounts((prev) => ({
        ...prev,
        [invoiceId]: outstanding.toFixed(2),
      }));
    }
  };

  const handlePaymentAmountChange = (invoiceId: string, amount: string) => {
    const invoice = outstandingInvoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    const maxAmount = invoice.amount_due - invoice.amount_paid;
    const numericAmount = parseFloat(amount) || 0;

    if (numericAmount <= maxAmount) {
      setPaymentAmounts((prev) => ({
        ...prev,
        [invoiceId]: amount,
      }));
    }
  };

  const handleProcessPayments = async () => {
    if (selectedInvoices.length === 0) {
      alert("Please select at least one invoice to pay");
      return;
    }

    const totalAmount = calculateTotal();
    if (totalAmount <= 0) {
      alert("Please enter valid payment amounts");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create payment records for each selected invoice
      const paymentPromises = selectedInvoices.map(async (invoiceId) => {
        const amount = parseFloat(paymentAmounts[invoiceId] || "0");
        if (amount <= 0) return;

        const { error } = await supabase.from("fee_payments").insert({
          invoice_id: invoiceId,
          amount: amount,
          payment_method: paymentMethod,
          payment_reference: paymentReference || null,
          payment_date: new Date().toISOString().split("T")[0],
          collected_by: user.id,
          notes: notes || null,
        });

        if (error) throw error;
      });

      await Promise.all(paymentPromises);

      alert(
        `Successfully recorded £${totalAmount.toFixed(2)} payment from ${
          student.first_name
        } ${student.last_name}`
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error processing payments:", error);
      alert("Failed to process payments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Receipt className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Fee Payment</h2>
              <p className="text-sm text-muted-foreground">
                {student.first_name} {student.last_name} (
                {student.student_number})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {outstandingInvoices.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Outstanding Fees</h3>
              <p className="text-muted-foreground">
                This student has no pending invoices.
              </p>
            </div>
          ) : (
            <>
              {/* Invoice Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Outstanding Invoices</h3>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-primary hover:underline"
                  >
                    {selectedInvoices.length === outstandingInvoices.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>

                <div className="space-y-3">
                  {outstandingInvoices.map((invoice) => {
                    const outstanding =
                      invoice.amount_due - invoice.amount_paid;
                    const isOverdue = new Date(invoice.due_date) < new Date();

                    return (
                      <div
                        key={invoice.id}
                        className={`
                          border rounded-lg p-4 transition-colors
                          ${
                            selectedInvoices.includes(invoice.id)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }
                        `}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedInvoices.includes(invoice.id)}
                              onChange={() => handleInvoiceToggle(invoice.id)}
                              className="mt-1 rounded border-gray-300 text-primary"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">
                                  {invoice.invoice_number}
                                </p>
                                {isOverdue && (
                                  <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full font-medium">
                                    OVERDUE
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {invoice.fee_structures?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Due:{" "}
                                {new Date(
                                  invoice.due_date
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">
                              £{outstanding.toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              of £{invoice.amount_due.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {selectedInvoices.includes(invoice.id) && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <label className="block text-sm font-medium mb-1">
                              Payment Amount (£)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={outstanding}
                              value={paymentAmounts[invoice.id] || ""}
                              onChange={(e) =>
                                handlePaymentAmountChange(
                                  invoice.id,
                                  e.target.value
                                )
                              }
                              className="w-32 px-3 py-1 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                              placeholder="0.00"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Maximum: £{outstanding.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedInvoices.length > 0 && (
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total Payment:</span>
                      <span className="text-xl font-bold text-primary">
                        £{calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Details */}
              {selectedInvoices.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Payment Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="form-input"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="online">Online Payment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Payment Reference (Optional)
                      </label>
                      <input
                        type="text"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        className="form-input"
                        placeholder="Transaction ID, cheque number, etc."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="form-input"
                      rows={3}
                      placeholder="Any additional notes about this payment..."
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {outstandingInvoices.length > 0 && selectedInvoices.length > 0 && (
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-border bg-muted/30">
            <button onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button
              onClick={handleProcessPayments}
              disabled={
                loading ||
                selectedInvoices.length === 0 ||
                calculateTotal() <= 0
              }
              className="btn-primary disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : `Record Payment £${calculateTotal().toFixed(2)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
