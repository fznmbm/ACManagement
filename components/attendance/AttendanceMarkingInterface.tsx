// components/attendance/AttendanceMarkingInterface.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Thermometer,
  Save,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Undo2,
  Send,
} from "lucide-react";
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

type AttendanceStatus = "present" | "absent" | "late" | "excused" | "sick";

const STATUSES: AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "excused",
  "sick",
];

// Seconds the "Finalise & notify" action waits before it actually saves —
// nothing is written (no fines, no parent notices) until this elapses, so
// "Undo" means nothing ever left.
const FINALIZE_DELAY = 60;

export default function AttendanceMarkingInterface({
  classes,
  students,
  existingAttendance,
  selectedClassId,
  selectedDate,
}: AttendanceMarkingInterfaceProps) {
  const router = useRouter();
  const supabase = createClient();
  const { toast, confirm } = useToast();

  const [attendanceMap, setAttendanceMap] = useState<
    Map<string, AttendanceStatus>
  >(new Map());
  const [notesMap, setNotesMap] = useState<Map<string, string>>(new Map());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Finalise + Undo countdown
  const [pendingSeconds, setPendingSeconds] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [selectedStudentForFines, setSelectedStudentForFines] =
    useState<StudentFineData | null>(null);
  const [showFineModal, setShowFineModal] = useState(false);
  const [studentFineDetails, setStudentFineDetails] = useState<Fine[]>([]);
  const { getStudentFines, fetchStudentFineDetails, refreshFines } = useFines();

  const [selectedStudentForFees, setSelectedStudentForFees] =
    useState<StudentFineData | null>(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [studentFeeInvoices, setStudentFeeInvoices] = useState<FeeInvoice[]>(
    [],
  );
  const { getStudentFees, fetchStudentInvoices, refreshFees } = useFees();

  // Present-default: everyone starts "present"; existing records override.
  // The teacher only taps the exceptions. No "unmarked" state, so Finalise
  // never silently decides a status.
  useEffect(() => {
    const existingById = new Map(
      existingAttendance.map((a) => [a.student_id, a]),
    );
    const newMap = new Map<string, AttendanceStatus>();
    const newNotes = new Map<string, string>();
    students.forEach((s) => {
      const ex = existingById.get(s.id);
      newMap.set(s.id, (ex?.status as AttendanceStatus) || "present");
      if (ex?.notes) newNotes.set(s.id, ex.notes);
    });
    setAttendanceMap(newMap);
    setNotesMap(newNotes);
  }, [existingAttendance, students]);

  // Clean up the finalise timer on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const navigate = (classId: string, date: string) => {
    cancelFinalize();
    const params = new URLSearchParams();
    params.set("class", classId);
    params.set("date", date);
    router.push(`/attendance?${params.toString()}`);
  };

  const setStudentAttendance = (id: string, status: AttendanceStatus) => {
    const newMap = new Map(attendanceMap);
    newMap.set(id, status);
    setAttendanceMap(newMap);
    setSaved(false);
  };

  const setStudentNote = (id: string, note: string) => {
    const newMap = new Map(notesMap);
    if (note) newMap.set(id, note);
    else newMap.delete(id);
    setNotesMap(newMap);
  };

  const markAll = (status: AttendanceStatus) => {
    const newMap = new Map<string, AttendanceStatus>();
    students.forEach((s) => newMap.set(s.id, status));
    setAttendanceMap(newMap);
    setSaved(false);
  };

  // The one write: upserts rows, keeps paid fines, triggers fines + notices.
  const doSave = async () => {
    setSaving(true);
    try {
      const records = students.map((s) => ({
        student_id: s.id,
        status: attendanceMap.get(s.id) || "present",
        notes: notesMap.get(s.id) || null,
      }));
      const { error } = await supabase.rpc("save_class_attendance", {
        p_class_id: selectedClassId,
        p_date: selectedDate,
        p_records: records,
      } as any);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
      refreshFines();
      refreshFees();
      toast.success("Register finalised");
    } catch (err) {
      console.error("Error saving attendance:", err);
      toast.error("Couldn't finalise the register. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Start the 60s window. Nothing is saved until it elapses or "Send now".
  const startFinalize = () => {
    if (saving || pendingSeconds !== null) return;
    setPendingSeconds(FINALIZE_DELAY);
    timerRef.current = setInterval(() => {
      setPendingSeconds((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearTimer();
          void doSave();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelFinalize = () => {
    clearTimer();
    setPendingSeconds(null);
  };

  const undoFinalize = () => {
    cancelFinalize();
    toast.info("Finalise cancelled — nothing was sent");
  };

  const sendNow = () => {
    clearTimer();
    setPendingSeconds(null);
    void doSave();
  };

  const handleClearDay = async () => {
    const ok = await confirm({
      title: "Clear this register?",
      message:
        "Remove all attendance for this class on this date. Unpaid fines for the day are removed too; paid/waived fines are kept. This cannot be undone.",
      destructive: true,
      confirmText: "Clear register",
    });
    if (!ok) return;

    setSaving(true);
    try {
      const { data: attendanceRecords } = await supabase
        .from("attendance")
        .select("id")
        .eq("class_id", selectedClassId)
        .eq("date", selectedDate);

      if (attendanceRecords && attendanceRecords.length > 0) {
        const ids = attendanceRecords.map((r) => r.id);
        const { count: settledFines } = await supabase
          .from("fines")
          .select("id", { count: "exact", head: true })
          .in("attendance_record_id", ids)
          .neq("status", "pending");

        if (settledFines && settledFines > 0) {
          toast.error(
            `${settledFines} fine(s) for this day are already paid or waived. Change individual students instead of clearing the day.`,
          );
          setSaving(false);
          return;
        }

        await supabase
          .from("fines")
          .delete()
          .in("attendance_record_id", ids)
          .eq("status", "pending");
      }

      const { error } = await supabase
        .from("attendance")
        .delete()
        .eq("class_id", selectedClassId)
        .eq("date", selectedDate);
      if (error) throw error;

      refreshFines();
      router.refresh();
      toast.success("Register cleared");
    } catch (err) {
      console.error("Error clearing attendance:", err);
      toast.error("Failed to clear the register.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenFineCollection = async (student: Student) => {
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
    } catch (err) {
      console.error("Error fetching student fines:", err);
    }
  };

  const handleOpenFeeCollection = async (student: Student) => {
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
    } catch (err) {
      console.error("Error fetching student fees:", err);
    }
  };

  const getStatusColor = (status: AttendanceStatus) =>
    ({
      present: "bg-green-100 text-green-800 border-green-300",
      absent: "bg-red-100 text-red-800 border-red-300",
      late: "bg-orange-100 text-orange-800 border-orange-300",
      excused: "bg-blue-100 text-blue-800 border-blue-300",
      sick: "bg-purple-100 text-purple-800 border-purple-300",
    })[status];

  const getStatusIcon = (status: AttendanceStatus) =>
    ({
      present: <CheckCircle className="h-4 w-4" />,
      absent: <XCircle className="h-4 w-4" />,
      late: <Clock className="h-4 w-4" />,
      excused: <AlertCircle className="h-4 w-4" />,
      sick: <Thermometer className="h-4 w-4" />,
    })[status];

  const values = Array.from(attendanceMap.values());
  const stats = {
    total: students.length,
    present: values.filter((s) => s === "present").length,
    absent: values.filter((s) => s === "absent").length,
    late: values.filter((s) => s === "late").length,
    excused: values.filter((s) => s === "excused" || s === "sick").length,
  };

  const dateObj = new Date(selectedDate + "T00:00:00");
  const dateLabel = dateObj.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const today = new Date().toISOString().split("T")[0];

  const shiftWeek = (deltaDays: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + deltaDays);
    const next = d.toISOString().split("T")[0];
    if (deltaDays > 0 && next > today) return;
    navigate(selectedClassId, next);
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
    <div className="space-y-6 pb-4">
      {/* Class and day selection */}
      <div className="bg-card border border-border rounded-lg p-4 md:p-6">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          <div>
            <label className="form-label">Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => navigate(e.target.value, selectedDate)}
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
            <label className="form-label">Class day</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => shiftWeek(-7)}
                className="btn-outline flex h-11 w-11 shrink-0 items-center justify-center p-0"
                title="Previous week"
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => navigate(selectedClassId, e.target.value)}
                max={today}
                className="form-input h-11 flex-1"
              />
              <button
                onClick={() => shiftWeek(7)}
                disabled={selectedDate >= today}
                className="btn-outline flex h-11 w-11 shrink-0 items-center justify-center p-0 disabled:opacity-40"
                title="Next week"
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{dateLabel}</p>
          </div>

          <div>
            <label className="form-label">Quick actions</label>
            <div className="flex gap-2">
              <button
                onClick={() => markAll("present")}
                className="btn-outline h-11 flex-1 text-sm"
              >
                All present
              </button>
              <button
                onClick={() => markAll("absent")}
                className="btn-outline h-11 flex-1 text-sm"
              >
                All absent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-2 md:grid-cols-5 md:gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/20 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-400">Present</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.present}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">Absent</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
            {stats.absent}
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 dark:bg-orange-900/20 dark:border-orange-800">
          <p className="text-sm text-orange-700 dark:text-orange-400">Late</p>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
            {stats.late}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/20 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            Excused / Sick
          </p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {stats.excused}
          </p>
        </div>
      </div>

      {/* Students */}
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
                <div key={student.id} className="p-4 transition-colors hover:bg-muted/30">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <span className="font-semibold text-primary">
                          {student.first_name.charAt(0)}
                          {student.last_name.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          #{student.student_number}
                        </p>
                      </div>
                      <FineIndicator
                        pendingFines={getStudentFines(student.id).pending_fines}
                        pendingAmount={getStudentFines(student.id).pending_amount}
                        onClick={() => handleOpenFineCollection(student)}
                      />
                      <FeeIndicator
                        pendingInvoices={getStudentFees(student.id).pending_invoices}
                        overdueInvoices={getStudentFees(student.id).overdue_invoices}
                        outstandingAmount={getStudentFees(student.id).outstanding_amount}
                        onClick={() => handleOpenFeeCollection(student)}
                      />
                    </div>

                    {/* Status buttons — ≥44px touch targets */}
                    <div className="flex flex-wrap gap-1.5">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => setStudentAttendance(student.id, s)}
                          className={`flex min-h-[44px] items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm font-medium capitalize transition-all ${
                            status === s
                              ? getStatusColor(s)
                              : "border-border bg-background text-muted-foreground hover:border-primary/50"
                          }`}
                          title={s}
                        >
                          {getStatusIcon(s)}
                          <span>{s}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Note */}
                  <input
                    type="text"
                    placeholder="Add a note (optional)…"
                    value={note}
                    onChange={(e) => setStudentNote(student.id, e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary sm:pl-[52px]"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sticky action bar */}
      {students.length > 0 && (
        <div className="sticky bottom-0 z-10 -mx-3 border-t border-border bg-card/95 px-3 py-3 backdrop-blur md:mx-0 md:rounded-lg md:border md:px-4 md:shadow-lg pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {pendingSeconds !== null ? (
            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-medium text-foreground">
                Finalising in {pendingSeconds}s… parents will be notified.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={undoFinalize}
                  className="btn-outline flex h-11 flex-1 items-center justify-center gap-2 sm:flex-none"
                >
                  <Undo2 className="h-4 w-4" />
                  Undo
                </button>
                <button
                  onClick={sendNow}
                  className="btn-primary flex h-11 flex-1 items-center justify-center gap-2 sm:flex-none"
                >
                  <Send className="h-4 w-4" />
                  Send now
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleClearDay}
                disabled={saving || existingAttendance.length === 0}
                className="btn-outline flex h-11 items-center gap-2 border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-40 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
              <div className="flex items-center gap-3">
                {saved && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Finalised
                  </span>
                )}
                <button
                  onClick={startFinalize}
                  disabled={saving}
                  className="btn-primary flex h-11 items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Finalise &amp; notify
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
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
