import React, { useState } from "react";
import { MoreHorizontal, UserX, UserMinus, Edit, Eye } from "lucide-react";
import StudentStatusBadge from "./StudentStatusBadge";
import StudentStatusChangeModal from "./StudentStatusChangeModal";
import StudentDeletionModal from "./StudentDeletionModal";
import { useStudentManagement } from "@/hooks/useStudentManagement";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  status: string;
  withdrawal_date?: string;
}

interface StudentActionButtonsProps {
  student: Student;
  onStudentUpdated: () => void;
}

export default function StudentActionButtons({
  student,
  onStudentUpdated,
}: StudentActionButtonsProps) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const { loading } = useStudentManagement();

  const handleStatusChange = () => {
    setShowStatusModal(true);
    setShowDropdown(false);
  };

  const handleDelete = () => {
    setShowDeletionModal(true);
    setShowDropdown(false);
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Status Badge
      <StudentStatusBadge
        status={student.status}
        withdrawalDate={student.withdrawal_date}
      /> */}

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {/* Quick Actions */}
        <a
          href={`/students/${student.id}`}
          className="text-primary hover:underline text-xs flex items-center space-x-1"
        >
          <Eye className="h-3 w-3" />
          <span>View</span>
        </a>

        <a
          href={`/students/${student.id}/edit`}
          className="text-blue-600 hover:underline text-xs flex items-center space-x-1"
        >
          <Edit className="h-3 w-3" />
          <span>Edit</span>
        </a>

        {/* More Actions Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-8 bg-background border rounded-lg shadow-lg py-2 z-50 min-w-[160px]">
              {student.status === "active" && (
                <button
                  onClick={handleStatusChange}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center space-x-2"
                >
                  <UserMinus className="h-4 w-4 text-orange-600" />
                  <span>Change Status</span>
                </button>
              )}

              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center space-x-2 text-red-600"
              >
                <UserX className="h-4 w-4" />
                <span>Remove Student</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <StudentStatusChangeModal
          student={student}
          isOpen={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          onSuccess={() => {
            onStudentUpdated();
            setShowStatusModal(false);
          }}
        />
      )}

      {/* Deletion Modal */}
      {showDeletionModal && (
        <StudentDeletionModal
          student={student}
          isOpen={showDeletionModal}
          onClose={() => setShowDeletionModal(false)}
          onSuccess={() => {
            onStudentUpdated();
            setShowDeletionModal(false);
          }}
        />
      )}
    </div>
  );
}
