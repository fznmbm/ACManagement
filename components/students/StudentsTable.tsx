// components/students/StudentsTable.tsx
"use client";

import Link from "next/link";
import { formatDate, calculateAge } from "@/lib/utils/helpers";
//import { Eye, Edit, Trash2 } from "lucide-react";
import FeeIndicator from "@/components/fees/FeeIndicator";
import FineIndicator from "@/components/fines/FineIndicator";
import { useFees } from "@/hooks/useFees";
import { useFines } from "@/hooks/useFines";
import FeePaymentModal from "@/components/fees/FeePaymentModal";
import FineCollectionModal from "@/components/fines/FineCollectionModal";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import StudentActionButtons from "./StudentActionButtons";

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  parent_phone: string;
  status: string;
  classes?: {
    id: string;
    name: string;
  } | null;
}

interface StudentsTableProps {
  students: Student[];
  onStudentUpdated: () => void;
}

export default function StudentsTable({
  students,
  onStudentUpdated,
}: StudentsTableProps) {
  const { getStudentFees, refreshFees } = useFees();
  const { getStudentFines, refreshFines } = useFines();
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showFineModal, setShowFineModal] = useState(false);
  const [selectedStudentForFees, setSelectedStudentForFees] =
    useState<any>(null);
  const [selectedStudentForFines, setSelectedStudentForFines] =
    useState<any>(null);
  const [studentFeeInvoices, setStudentFeeInvoices] = useState<any[]>([]);
  const [studentFineDetails, setStudentFineDetails] = useState<any[]>([]);

  const supabase = createClient();

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      graduated: "bg-blue-100 text-blue-800",
      withdrawn: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (students.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground text-lg">
          No students found. Add your first student to get started.
        </p>
        <Link href="/students/new" className="btn-primary mt-4 inline-flex">
          Add Student
        </Link>
      </div>
    );
  }

  const handleOpenFeeCollection = async (student: any) => {
    try {
      const { data, error } = await supabase
        .from("fee_invoices")
        .select(
          `
        *,
        fee_structures (name, frequency)
      `
        )
        .eq("student_id", student.id)
        .in("status", ["pending", "partial", "overdue"])
        .order("due_date", { ascending: true });

      if (error) throw error;

      setSelectedStudentForFees({
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        student_number: student.student_number,
      });
      setStudentFeeInvoices(data || []);
      setShowFeeModal(true);
    } catch (error) {
      console.error("Error fetching student fees:", error);
    }
  };

  const handleOpenFineCollection = async (student: any) => {
    try {
      const { data, error } = await supabase
        .from("fines")
        .select("*")
        .eq("student_id", student.id)
        .eq("status", "pending")
        .order("issued_date", { ascending: false });

      if (error) throw error;

      setSelectedStudentForFines({
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        student_number: student.student_number,
      });
      setStudentFineDetails(data || []);
      setShowFineModal(true);
    } catch (error) {
      console.error("Error fetching student fines:", error);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Student #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Age
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Gender
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Parent Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.map((student) => (
              <tr
                key={student.id}
                // className="hover:bg-muted/30 transition-colors"
                className="table-row-hover"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-mono text-muted-foreground">
                    {student.student_number}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="text-sm font-medium">
                        {student.first_name} {student.last_name}
                      </p>
                    </div>

                    {/* Fee Indicator */}
                    <FeeIndicator
                      pendingInvoices={
                        getStudentFees(student.id).pending_invoices
                      }
                      overdueInvoices={
                        getStudentFees(student.id).overdue_invoices
                      }
                      outstandingAmount={
                        getStudentFees(student.id).outstanding_amount
                      }
                      onClick={() => handleOpenFeeCollection(student)} // CHANGED
                      size="sm"
                    />
                    {/* Fine Indicator */}
                    <FineIndicator
                      pendingFines={getStudentFines(student.id).pending_fines}
                      pendingAmount={getStudentFines(student.id).pending_amount}
                      onClick={() => handleOpenFineCollection(student)}
                      size="sm"
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {student.date_of_birth
                    ? calculateAge(student.date_of_birth)
                    : "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm capitalize">{student.gender}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {student.classes?.name || (
                    <span className="text-muted-foreground italic">
                      ⚠️ Unassigned
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {student.parent_phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      student.status
                    )}`}
                  >
                    {student.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {/* <div className="flex items-center space-x-2">
                    <Link
                      href={`/students/${student.id}`}
                      className="p-1 hover:bg-accent rounded"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4 text-blue-600" />
                    </Link>
                    <Link
                      href={`/students/${student.id}/edit`}
                      className="p-1 hover:bg-accent rounded"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4 text-green-600" />
                    </Link>
                    <button
                      className="p-1 hover:bg-accent rounded"
                      title="Delete"
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to delete this student?"
                          )
                        ) {
                          // TODO: Implement delete
                          alert("Delete functionality coming soon!");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div> */}

                  <StudentActionButtons
                    student={student}
                    onStudentUpdated={onStudentUpdated}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Placeholder */}
      <div className="px-6 py-4 border-t border-border flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {students.length} student{students.length !== 1 ? "s" : ""}
        </p>
        {/* Add pagination controls here later */}
      </div>

      {/* Fee Payment Modal */}
      {selectedStudentForFees && (
        <FeePaymentModal
          isOpen={showFeeModal}
          onClose={() => setShowFeeModal(false)}
          student={selectedStudentForFees}
          invoices={studentFeeInvoices}
          onSuccess={() => {
            setShowFeeModal(false);
            // Could refresh data here
          }}
        />
      )}

      {/* Fine Collection Modal */}
      {selectedStudentForFines && (
        <FineCollectionModal
          isOpen={showFineModal}
          onClose={() => setShowFineModal(false)}
          student={selectedStudentForFines}
          fines={studentFineDetails}
          onSuccess={() => {
            setShowFineModal(false);
            refreshFees();
            refreshFines();
          }}
        />
      )}
    </div>
  );
}
