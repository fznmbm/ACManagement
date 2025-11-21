// components/fines/FineCollectionModal.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Coins, CheckCircle, XCircle } from "lucide-react";
import { Fine, StudentFineData } from "@/types/fines";

// interface Fine {
//   id: string;
//   student_id: string;
//   class_id?: string;
//   fine_type: string;
//   amount: number;
//   status: string;
//   issued_date: string;
//   paid_date?: string;
//   payment_method?: string;
//   notes?: string;
//   attendance_record_id: string;
//   students?: {
//     first_name: string;
//     last_name: string;
//     student_number: string;
//   };
//   collected_by_profile?: {
//     full_name: string;
//   };
// }

interface FineCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentFineData;
  fines: Fine[];
  onSuccess?: () => void;
}

export default function FineCollectionModal({
  isOpen,
  onClose,
  student,
  fines,
  onSuccess,
}: FineCollectionModalProps) {
  const [selectedFines, setSelectedFines] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  if (!isOpen) return null;

  const pendingFines = fines.filter((fine) => fine !== undefined);
  const totalSelected = pendingFines
    .filter((fine) => selectedFines.includes(fine.id))
    .reduce((sum, fine) => sum + fine.amount, 0);

  const handleSelectAll = () => {
    if (selectedFines.length === pendingFines.length) {
      setSelectedFines([]);
    } else {
      setSelectedFines(pendingFines.map((fine) => fine.id));
    }
  };

  const handleFineToggle = (fineId: string) => {
    setSelectedFines((prev) =>
      prev.includes(fineId)
        ? prev.filter((id) => id !== fineId)
        : [...prev, fineId]
    );
  };

  const handleCollectFines = async () => {
    if (selectedFines.length === 0) {
      alert("Please select at least one fine to collect");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update selected fines to paid status
      const { error } = await supabase
        .from("fines")
        .update({
          status: "paid",
          paid_date: new Date().toISOString().split("T")[0],
          collected_by: user.id,
          payment_method: paymentMethod,
          notes: notes || null,
        })
        .in("id", selectedFines);

      if (error) throw error;

      alert(
        `Successfully collected £${totalSelected.toFixed(2)} from ${
          student.first_name
        } ${student.last_name}`
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error collecting fines:", error);
      alert("Failed to collect fines");
    } finally {
      setLoading(false);
    }
  };

  const handleWaiveFines = async () => {
    if (selectedFines.length === 0) {
      alert("Please select at least one fine to waive");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to waive £${totalSelected.toFixed(2)} in fines?`
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update selected fines to waived status
      const { error } = await supabase
        .from("fines")
        .update({
          status: "waived",
          collected_by: user.id,
          notes: notes || "Fine waived",
        })
        .in("id", selectedFines);

      if (error) throw error;

      alert(
        `Successfully waived £${totalSelected.toFixed(2)} in fines for ${
          student.first_name
        } ${student.last_name}`
      );
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error waiving fines:", error);
      alert("Failed to waive fines");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <Coins className="h-6 w-6 text-yellow-600" />
            <div>
              <h2 className="text-xl font-semibold">Fine Collection</h2>
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
          {pendingFines.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Pending Fines</h3>
              <p className="text-muted-foreground">
                This student has no outstanding fines.
              </p>
            </div>
          ) : (
            <>
              {/* Fine Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Outstanding Fines</h3>
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-primary hover:underline"
                  >
                    {selectedFines.length === pendingFines.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>

                <div className="space-y-3">
                  {pendingFines.map((fine) => (
                    <div
                      key={fine.id}
                      className={`
                        flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors
                        ${
                          selectedFines.includes(fine.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }
                      `}
                      onClick={() => handleFineToggle(fine.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedFines.includes(fine.id)}
                          onChange={() => handleFineToggle(fine.id)}
                          className="rounded border-gray-300 text-primary"
                        />
                        <div>
                          <p className="font-medium capitalize">
                            {fine.fine_type} Fine
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Issued:{" "}
                            {new Date(fine.issued_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          £{fine.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Selected:</span>
                    <span className="text-xl font-bold text-primary">
                      £{totalSelected.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
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
                </select>
              </div>

              {/* Notes */}
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
            </>
          )}
        </div>

        {/* Footer */}
        {pendingFines.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-border bg-muted/30">
            <button
              onClick={handleWaiveFines}
              disabled={loading || selectedFines.length === 0}
              className="btn-outline text-orange-600 border-orange-600 hover:bg-orange-50 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Waive Selected
            </button>

            <div className="flex items-center space-x-3">
              <button onClick={onClose} className="btn-outline">
                Cancel
              </button>
              <button
                onClick={handleCollectFines}
                disabled={loading || selectedFines.length === 0}
                className="btn-primary disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : `Collect £${totalSelected.toFixed(2)}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
