import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { useStudentManagement } from "@/hooks/useStudentManagement";
import FinancialImpactWarning from "./FinancialImpactWarning";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  status: string;
}

interface StudentStatusChangeModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StudentStatusChangeModal({
  student,
  isOpen,
  onClose,
  onSuccess,
}: StudentStatusChangeModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(student.status);
  const [reason, setReason] = useState("");
  const { loading, updateStudentStatus } = useStudentManagement();

  const statusOptions = [
    {
      value: "active",
      label: "Active",
      color: "text-green-600",
      description: "Normal billing continues",
    },
    {
      value: "inactive",
      label: "Inactive/Suspended",
      color: "text-yellow-600",
      description: "Temporarily suspended, no new fees generated",
    },
    {
      value: "withdrawn",
      label: "Withdrawn",
      color: "text-red-600",
      description: "Left school permanently, end all billing",
    },
    {
      value: "graduated",
      label: "Graduated",
      color: "text-blue-600",
      description: "Completed program, end all billing",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      alert("Please provide a reason for the status change");
      return;
    }

    const result = await updateStudentStatus(
      student.id,
      selectedStatus,
      reason
    );

    if (result.success) {
      alert(`Student status updated to ${selectedStatus} successfully`);
      onSuccess();
    } else {
      alert(`Failed to update status: ${result.error}`);
    }
  };

  if (!isOpen) return null;

  const selectedOption = statusOptions.find(
    (opt) => opt.value === selectedStatus
  );
  const showFinancialWarning = selectedStatus !== student.status;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            Change Status - {student.first_name} {student.last_name}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Student Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="font-medium">
              Student: {student.first_name} {student.last_name}
            </p>
            <p className="text-sm text-muted-foreground">
              Number: {student.student_number} • Current Status:{" "}
              {student.status}
            </p>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">New Status</label>
            <div className="space-y-3">
              {statusOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedStatus === option.value
                      ? "border-primary bg-primary/5"
                      : "border-input hover:border-primary/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={selectedStatus === option.value}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className={`font-medium ${option.color}`}>
                      {option.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Financial Impact Warning */}
          {showFinancialWarning && (
            <FinancialImpactWarning
              studentId={student.id}
              actionType="status_change"
              newStatus={selectedStatus}
            />
          )}

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium mb-2">
              Reason for Status Change *
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for status change..."
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-muted-foreground hover:text-foreground border border-input rounded-lg hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading || !reason.trim() || selectedStatus === student.status
              }
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Status</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
