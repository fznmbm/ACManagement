// components/attendance/AttendanceMarkingInterface.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  RefreshCw,
} from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";
import FineIndicator from "@/components/fines/FineIndicator";
import FineCollectionModal from "@/components/fines/FineCollectionModal";
import { useFines } from "@/hooks/useFines";
import { Fine, StudentFineData } from "@/types/fines";
import FeeIndicator from "@/components/fees/FeeIndicator";
import FeePaymentModal from "@/components/fees/FeePaymentModal";
import { useFees } from "@/hooks/useFees";
import { FeeInvoice } from "@/types/fees";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
  photo_url?: string;
}

interface Attendance {
  id: string;
  student_id: string;
  status: string;
  notes?: string;
}

interface AttendanceMarkingInterfaceProps {
  classes: Array<{ id: string; name: string }>;
  students: Student[];
  existingAttendance: Attendance[];
  selectedClassId: string;
  selectedDate: string;
  userRole: string;
}

// interface FineDetail {
//   id: string;
//   fine_type: string;
//   amount: number;
//   status: string;
//   issued_date: string;
//   paid_date?: string;
//   attendance_record_id: string;
// }

// interface SelectedStudent {
//   id: string;
//   first_name: string;
//   last_name: string;
//   student_number: string;
// }

type AttendanceStatus = "present" | "absent" | "late" | "excused" | "sick";

export default function AttendanceMarkingInterface({
  classes,
  students,
  existingAttendance,
  selectedClassId,
  selectedDate,
  userRole,
}: AttendanceMarkingInterfaceProps) {
  const router = useRouter();
  const supabase = createClient();

  const [attendanceMap, setAttendanceMap] = useState<
    Map<string, AttendanceStatus>
  >(new Map());
  const [notesMap, setNotesMap] = useState<Map<string, string>>(new Map());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [selectedStudentForFines, setSelectedStudentForFines] =
    useState<StudentFineData | null>(null);
  const [showFineModal, setShowFineModal] = useState(false);
  const [studentFineDetails, setStudentFineDetails] = useState<Fine[]>([]);

  const { getStudentFines, fetchStudentFineDetails, refreshFines } = useFines();

  const [selectedStudentForFees, setSelectedStudentForFees] =
    useState<StudentFineData | null>(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [studentFeeInvoices, setStudentFeeInvoices] = useState<FeeInvoice[]>(
    []
  );

  const { getStudentFees, fetchStudentInvoices, refreshFees } = useFees();

  // Initialize attendance from existing data
  useEffect(() => {
    const newMap = new Map<string, AttendanceStatus>();
    const newNotesMap = new Map<string, string>();

    existingAttendance.forEach((att) => {
      newMap.set(att.student_id, att.status as AttendanceStatus);
      if (att.notes) {
        newNotesMap.set(att.student_id, att.notes);
      }
    });

    setAttendanceMap(newMap);
    setNotesMap(newNotesMap);
  }, [existingAttendance]);

  const handleClassChange = (classId: string) => {
    const params = new URLSearchParams();
    params.set("class", classId);
    params.set("date", selectedDate);
    router.push(`/attendance?${params.toString()}`);
  };

  const handleDateChange = (date: string) => {
    const params = new URLSearchParams();
    params.set("class", selectedClassId);
    params.set("date", date);
    router.push(`/attendance?${params.toString()}`);
  };

  const setStudentAttendance = (
    studentId: string,
    status: AttendanceStatus
  ) => {
    const newMap = new Map(attendanceMap);
    newMap.set(studentId, status);
    setAttendanceMap(newMap);
    setSaved(false);
  };

  const setStudentNote = (studentId: string, note: string) => {
    const newMap = new Map(notesMap);
    if (note) {
      newMap.set(studentId, note);
    } else {
      newMap.delete(studentId);
    }
    setNotesMap(newMap);
  };

  const markAll = (status: AttendanceStatus) => {
    const newMap = new Map<string, AttendanceStatus>();
    students.forEach((student) => {
      newMap.set(student.id, status);
    });
    setAttendanceMap(newMap);
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Prepare attendance records
      const attendanceRecords = students.map((student) => ({
        student_id: student.id,
        class_id: selectedClassId,
        date: selectedDate,
        status: attendanceMap.get(student.id) || "present",
        session_type: "regular",
        notes: notesMap.get(student.id) || null,
        marked_by: user?.id,
      }));

      // Delete existing attendance for this class and date
      await supabase
        .from("attendance")
        .delete()
        .eq("class_id", selectedClassId)
        .eq("date", selectedDate);

      // Insert new attendance records
      const { error } = await supabase
        .from("attendance")
        .insert(attendanceRecords);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
      refreshFines();
      refreshFees(); // add this
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenFineCollection = async (student: any) => {
    try {
      const fineDetails = await fetchStudentFineDetails(student.id);
      setSelectedStudentForFines({
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        student_number: student.student_number,
      });
      setStudentFineDetails(fineDetails);
      setShowFineModal(true);
    } catch (error) {
      console.error("Error fetching student fines:", error);
    }
  };

  const handleOpenFeeCollection = async (student: any) => {
    try {
      const invoices = await fetchStudentInvoices(student.id);
      setSelectedStudentForFees({
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        student_number: student.student_number,
      });
      setStudentFeeInvoices(invoices);
      setShowFeeModal(true);
    } catch (error) {
      console.error("Error fetching student fees:", error);
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    const colors = {
      present: "bg-green-100 text-green-800 border-green-300",
      absent: "bg-red-100 text-red-800 border-red-300",
      late: "bg-orange-100 text-orange-800 border-orange-300",
      excused: "bg-blue-100 text-blue-800 border-blue-300",
      sick: "bg-purple-100 text-purple-800 border-purple-300",
    };
    return colors[status];
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    const icons = {
      present: <CheckCircle className="h-4 w-4" />,
      absent: <XCircle className="h-4 w-4" />,
      late: <Clock className="h-4 w-4" />,
      excused: <AlertCircle className="h-4 w-4" />,
      sick: <AlertCircle className="h-4 w-4" />,
    };
    return icons[status];
  };

  const stats = {
    total: students.length,
    present: Array.from(attendanceMap.values()).filter((s) => s === "present")
      .length,
    absent: Array.from(attendanceMap.values()).filter((s) => s === "absent")
      .length,
    late: Array.from(attendanceMap.values()).filter((s) => s === "late").length,
    excused: Array.from(attendanceMap.values()).filter((s) => s === "excused")
      .length,
  };

  if (!selectedClassId || classes.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground text-lg">
          {classes.length === 0
            ? "No classes available. Please create a class first or contact your administrator."
            : "Select a class to mark attendance."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Class and Date Selection */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => handleClassChange(e.target.value)}
              className="form-input"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Quick Actions</label>
            <div className="flex gap-2">
              <button
                onClick={() => markAll("present")}
                className="btn-outline flex-1 text-sm"
                title="Mark all present"
              >
                All Present
              </button>
              <button
                onClick={() => markAll("absent")}
                className="btn-outline flex-1 text-sm"
                title="Mark all absent"
              >
                All Absent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">Present</p>
          <p className="text-2xl font-bold text-green-700">{stats.present}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Absent</p>
          <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-700">Late</p>
          <p className="text-2xl font-bold text-orange-700">{stats.late}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">Excused</p>
          <p className="text-2xl font-bold text-blue-700">{stats.excused}</p>
        </div>
      </div>

      {/* Students List */}
      {students.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground">
            No students enrolled in this class yet.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="divide-y divide-border">
            {students.map((student) => {
              const status = attendanceMap.get(student.id);
              const note = notesMap.get(student.id) || "";

              return (
                <div
                  key={student.id}
                  className="p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {student.first_name.charAt(0)}
                          {student.last_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          #{student.student_number}
                        </p>
                      </div>
                      {/* Fine Indicator */}
                      <FineIndicator
                        pendingFines={getStudentFines(student.id).pending_fines}
                        pendingAmount={
                          getStudentFines(student.id).pending_amount
                        }
                        onClick={() => handleOpenFineCollection(student)}
                      />
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
                        onClick={() => handleOpenFeeCollection(student)}
                      />
                    </div>

                    {/* Status Buttons */}
                    <div className="flex gap-2">
                      {(
                        [
                          "present",
                          "absent",
                          "late",
                          "excused",
                        ] as AttendanceStatus[]
                      ).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStudentAttendance(student.id, s)}
                          className={`px-3 py-2 rounded-lg border-2 transition-all flex items-center space-x-1 text-sm font-medium ${
                            status === s
                              ? getStatusColor(s)
                              : "bg-background border-border text-muted-foreground hover:border-primary/50"
                          }`}
                          title={s.charAt(0).toUpperCase() + s.slice(1)}
                        >
                          {getStatusIcon(s)}
                          <span className="capitalize">{s}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="ml-13">
                    <input
                      type="text"
                      placeholder="Add a note (optional)..."
                      value={note}
                      onChange={(e) =>
                        setStudentNote(student.id, e.target.value)
                      }
                      className="w-full px-3 py-1.5 text-sm border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Save Button */}
      {students.length > 0 && (
        <div className="flex items-center justify-end space-x-4">
          {saved && (
            <span className="text-sm text-green-600 flex items-center space-x-1">
              <CheckCircle className="h-4 w-4" />
              <span>Attendance saved successfully!</span>
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Attendance</span>
              </>
            )}
          </button>
        </div>
      )}

      {selectedStudentForFines && (
        <FineCollectionModal
          isOpen={showFineModal}
          onClose={() => setShowFineModal(false)}
          student={selectedStudentForFines}
          fines={studentFineDetails}
          onSuccess={() => {
            refreshFines();
            setShowFineModal(false);
          }}
        />
      )}

      {selectedStudentForFees && (
        <FeePaymentModal
          isOpen={showFeeModal}
          onClose={() => setShowFeeModal(false)}
          student={selectedStudentForFees}
          invoices={studentFeeInvoices}
          onSuccess={() => {
            refreshFees();
            setShowFeeModal(false);
          }}
        />
      )}
    </div>
  );
}
