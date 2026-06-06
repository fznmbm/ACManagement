"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Receipt, CheckCircle, Printer } from "lucide-react";
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
    {},
  );
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    studentName: string;
    studentNumber: string;
    amount: number;
    method: string;
    reference: string;
    date: string;
    invoices: { number: string; description: string; amount: number }[];
  } | null>(null);

  const supabase = createClient();

  const printReceipt = (data: typeof receiptData) => {
    if (!data) return;
    const win = window.open("", "_blank", "width=600,height=700");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 500px; margin: 0 auto; color: #111; }
          .header { text-align: center; border-bottom: 2px solid #22c55e; padding-bottom: 16px; margin-bottom: 20px; }
          .header h1 { color: #22c55e; font-size: 24px; margin: 0; }
          .header p { color: #666; margin: 4px 0; font-size: 13px; }
          .receipt-title { text-align: center; font-size: 18px; font-weight: bold; margin: 16px 0; letter-spacing: 2px; color: #333; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .row.border-top { border-top: 1px solid #eee; margin-top: 8px; padding-top: 12px; }
          .label { color: #666; }
          .value { font-weight: 500; }
          .total-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: bold; border-top: 2px solid #22c55e; margin-top: 8px; }
          .total-row .amount { color: #22c55e; }
          .invoices { background: #f9f9f9; border-radius: 6px; padding: 12px; margin: 16px 0; }
          .invoice-item { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
          .footer { text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Al Hikmah Institute Crawley</h1>
          <p>Payment Receipt</p>
        </div>
        <div class="receipt-title">OFFICIAL RECEIPT</div>
        <div class="row"><span class="label">Receipt Date</span><span class="value">${data.date}</span></div>
        <div class="row"><span class="label">Student Name</span><span class="value">${data.studentName}</span></div>
        <div class="row"><span class="label">Student Number</span><span class="value">${data.studentNumber}</span></div>
        <div class="row"><span class="label">Payment Method</span><span class="value">${data.method.replace("_", " ").toUpperCase()}</span></div>
        ${data.reference ? `<div class="row"><span class="label">Reference</span><span class="value">${data.reference}</span></div>` : ""}
        <div class="invoices">
          <div style="font-size:12px;font-weight:bold;margin-bottom:8px;color:#555;">INVOICES PAID</div>
          ${data.invoices
            .map(
              (inv) => `
            <div class="invoice-item">
              <span>${inv.number} — ${inv.description}</span>
              <span>£${inv.amount.toFixed(2)}</span>
            </div>
          `,
            )
            .join("")}
        </div>
        <div class="total-row">
          <span>Total Paid</span>
          <span class="amount">£${data.amount.toFixed(2)}</span>
        </div>
        <div class="footer">
          <p>Thank you for your payment</p>
          <p>Al Hikmah Institute Crawley · info@al-hikmah.org</p>
          <p>Generated on ${new Date().toLocaleString("en-GB")}</p>
        </div>
        <br/>
        <button onclick="window.print()" style="display:block;margin:0 auto;padding:10px 24px;background:#22c55e;color:white;border:none;border-radius:6px;font-size:14px;cursor:pointer;">
          🖨️ Print Receipt
        </button>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
  };

  if (!isOpen) return null;

  const outstandingInvoices = invoices.filter(
    (invoice) => invoice !== undefined,
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

      // Build receipt data
      const receipt = {
        studentName: `${student.first_name} ${student.last_name}`,
        studentNumber: student.student_number,
        amount: totalAmount,
        method: paymentMethod,
        reference: paymentReference,
        date: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        invoices: selectedInvoices.map((id) => {
          const inv = outstandingInvoices.find((i) => i.id === id);
          return {
            number: inv?.invoice_number || id,
            description: inv?.fee_structures?.name || "Fee Payment",
            amount: parseFloat(paymentAmounts[id] || "0"),
          };
        }),
      };

      setReceiptData(receipt);
      onSuccess?.();
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
                                  invoice.due_date,
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
                                  e.target.value,
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

        {/* Receipt prompt after payment */}
        {receiptData && (
          <div className="p-6 border-t border-border bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-400">
                  Payment of £{receiptData.amount.toFixed(2)} recorded
                  successfully
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => printReceipt(receiptData)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </button>
                <button
                  onClick={() => {
                    setReceiptData(null);
                    onClose();
                  }}
                  className="btn-outline text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {outstandingInvoices.length > 0 &&
          selectedInvoices.length > 0 &&
          !receiptData && (
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
