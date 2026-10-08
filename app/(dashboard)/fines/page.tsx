// app/(dashboard)/fines/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download } from "lucide-react";
import FineCollectionModal from "@/components/fines/FineCollectionModal";
import FinanceTabs from "@/components/finance/FinanceTabs";
import ReasonDialog from "@/components/ui/ReasonDialog";
import { Pagination } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils/helpers";
import { Fine, StudentFineData } from "@/types/fines";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string;
}
interface Class {
  id: string;
  name: string;
}

const PAGE_SIZE = 20;

export default function FinesPage() {
  const supabase = createClient();
  const { toast } = useToast();

  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] =
    useState<StudentFineData | null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [pendingFines, setPendingFines] = useState<Fine[]>([]);
  const [classFilter, setClassFilter] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [page, setPage] = useState(1);

  // Waive-with-reason dialog
  const [waiveTarget, setWaiveTarget] = useState<{
    id: string;
    amount: number;
  } | null>(null);
  const [waiving, setWaiving] = useState(false);

  const fetchFines = async () => {
    try {
      setLoading(true);
      let fineQuery = supabase
        .from("fines")
        .select("*")
        .order("issued_date", { ascending: false });

      if (dateFromFilter) fineQuery = fineQuery.gte("issued_date", dateFromFilter);
      if (dateToFilter) fineQuery = fineQuery.lte("issued_date", dateToFilter);
      if (studentFilter) fineQuery = fineQuery.eq("student_id", studentFilter);

      const { data: finesData, error: finesError } = await fineQuery;
      if (finesError) throw finesError;

      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, first_name, last_name, student_number, class_id");
      if (studentsError) throw studentsError;

      let finesWithStudents = (finesData || [])
        .map((fine) => ({
          ...fine,
          students: studentsData?.find((s) => s.id === fine.student_id),
        }))
        .filter((fine) => fine.students);

      if (classFilter) {
        finesWithStudents = finesWithStudents.filter(
          (fine) => fine.students?.class_id === classFilter,
        );
      }
      setFines(finesWithStudents);
    } catch (error) {
      console.error("Error fetching fines:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchFines();
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter, studentFilter, dateFromFilter, dateToFilter]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select("id, first_name, last_name, student_number")
      .eq("status", "active")
      .order("first_name");
    if (!error) setStudents(data || []);
  };

  const fetchClasses = async () => {
    const { data, error } = await supabase
      .from("classes")
      .select("id, name")
      .order("name");
    if (!error) setClasses(data || []);
  };

  const handleViewStudentFines = async (student: any) => {
    try {
      const { data, error } = await supabase
        .from("fines")
        .select("*")
        .eq("student_id", student.id)
        .eq("status", "pending")
        .order("issued_date", { ascending: false });
      if (error) throw error;
      setSelectedStudent({
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        student_number: student.student_number,
      });
      setPendingFines(data || []);
      setShowCollectionModal(true);
    } catch (error) {
      console.error("Error fetching student fines:", error);
    }
  };

  const confirmWaive = async (reason: string) => {
    if (!waiveTarget) return;
    setWaiving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("fines")
        .update({
          status: "waived",
          collected_by: user?.id,
          notes: reason || "Waived by admin",
        })
        .eq("id", waiveTarget.id);
      if (error) throw error;
      setWaiveTarget(null);
      fetchFines();
      toast.success("Fine waived");
    } catch (error) {
      console.error("Error waiving fine:", error);
      toast.error("Couldn't waive the fine. Please try again.");
    } finally {
      setWaiving(false);
    }
  };

  const filteredFines = fines.filter(
    (fine) => filter === "all" || fine.status === filter,
  );
  const pageCount = Math.max(1, Math.ceil(filteredFines.length / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const paged = filteredFines.slice(pageStart, pageStart + PAGE_SIZE);

  const stats = {
    total: fines.length,
    pending: fines.filter((f) => f.status === "pending").length,
    paid: fines.filter((f) => f.status === "paid").length,
    waived: fines.filter((f) => f.status === "waived").length,
    pendingAmount: fines
      .filter((f) => f.status === "pending")
      .reduce((sum, f) => sum + f.amount, 0),
    collectedAmount: fines
      .filter((f) => f.status === "paid")
      .reduce((sum, f) => sum + f.amount, 0),
  };

  const exportToCSV = () => {
    if (filteredFines.length === 0) {
      toast.error("No fines to export");
      return;
    }
    const headers = [
      "Student Number",
      "Student Name",
      "Fine Type",
      "Amount",
      "Status",
      "Issued Date",
      "Paid Date",
      "Payment Method",
      "Notes",
    ];
    const rows = filteredFines.map((fine) => [
      fine.students?.student_number || "",
      `${fine.students?.first_name || ""} ${fine.students?.last_name || ""}`,
      fine.fine_type,
      `£${fine.amount.toFixed(2)}`,
      fine.status,
      formatDate(fine.issued_date),
      fine.paid_date ? formatDate(fine.paid_date) : "",
      fine.payment_method || "",
      fine.notes || "",
    ]);
    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fines-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const statusChip = (status: string) =>
    status === "pending"
      ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
      : status === "paid"
        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
        : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <FinanceTabs active="fines" />
        <button
          onClick={exportToCSV}
          className="btn-outline flex items-center gap-2 self-start"
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6 md:gap-4">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
            {stats.pending}
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-500">Pending</p>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-900/20">
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.paid}
          </p>
          <p className="text-sm text-green-600 dark:text-green-500">Paid</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {stats.waived}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-500">Waived</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
            £{stats.pendingAmount.toFixed(2)}
          </p>
          <p className="text-sm text-red-600 dark:text-red-500">Outstanding</p>
        </div>
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            £{stats.collectedAmount.toFixed(2)}
          </p>
          <p className="text-sm text-primary">Collected</p>
        </div>
      </div>

      {/* Filters (one card, applies on change) */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5 md:gap-4">
          <div>
            <label className="form-label">Class</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Student</label>
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All students</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} (#{s.student_number})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="form-input"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="waived">Waived</option>
            </select>
          </div>
          <div>
            <label className="form-label">From date</label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">To date</label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Fines table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="border-b border-border bg-muted/50 px-4 py-3">
          <h3 className="font-semibold">Fine records ({filteredFines.length})</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : filteredFines.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No fines match these filters.
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="divide-y divide-border md:hidden">
              {paged.map((fine) => (
                <div key={fine.id} className="space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {fine.students?.first_name} {fine.students?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fine.students?.student_number}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${statusChip(fine.status)}`}
                    >
                      {fine.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{fine.fine_type}</span>
                    <span className="font-semibold text-foreground">
                      £{fine.amount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Issued: {formatDate(fine.issued_date)}
                  </p>
                  {fine.status === "pending" && (
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() =>
                          handleViewStudentFines({
                            id: fine.student_id,
                            first_name: fine.students?.first_name,
                            last_name: fine.students?.last_name,
                            student_number: fine.students?.student_number,
                          })
                        }
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Collect
                      </button>
                      <button
                        onClick={() =>
                          setWaiveTarget({ id: fine.id, amount: fine.amount })
                        }
                        className="text-xs font-medium text-orange-600 hover:underline dark:text-orange-400"
                      >
                        Waive
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Student</th>
                    <th className="px-4 py-2 text-left font-semibold">Type</th>
                    <th className="px-4 py-2 text-left font-semibold">Amount</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-left font-semibold">Issued</th>
                    <th className="px-4 py-2 text-left font-semibold">Paid</th>
                    <th className="px-4 py-2 text-left font-semibold">Method</th>
                    <th className="px-4 py-2 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paged.map((fine) => (
                    <tr key={fine.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium">
                          {fine.students?.first_name} {fine.students?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fine.students?.student_number}
                        </p>
                      </td>
                      <td className="px-4 py-3 capitalize">{fine.fine_type}</td>
                      <td className="px-4 py-3 font-semibold">
                        £{fine.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${statusChip(fine.status)}`}
                        >
                          {fine.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatDate(fine.issued_date)}</td>
                      <td className="px-4 py-3">
                        {fine.paid_date ? formatDate(fine.paid_date) : "-"}
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {fine.payment_method || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {fine.status === "pending" ? (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                handleViewStudentFines({
                                  id: fine.student_id,
                                  first_name: fine.students?.first_name,
                                  last_name: fine.students?.last_name,
                                  student_number: fine.students?.student_number,
                                })
                              }
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              Collect
                            </button>
                            <button
                              onClick={() =>
                                setWaiveTarget({
                                  id: fine.id,
                                  amount: fine.amount,
                                })
                              }
                              className="text-xs font-medium text-orange-600 hover:underline dark:text-orange-400"
                            >
                              Waive
                            </button>
                          </div>
                        ) : fine.status === "paid" ? (
                          <span className="text-xs text-green-600">✓ Paid</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Waived
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-border px-4 py-3">
              <Pagination
                page={page}
                pageCount={pageCount}
                total={filteredFines.length}
                from={filteredFines.length === 0 ? 0 : pageStart + 1}
                to={Math.min(pageStart + PAGE_SIZE, filteredFines.length)}
                onPageChange={setPage}
                className="mt-0"
              />
            </div>
          </>
        )}
      </div>

      {selectedStudent && (
        <FineCollectionModal
          isOpen={showCollectionModal}
          onClose={() => setShowCollectionModal(false)}
          student={selectedStudent}
          fines={pendingFines}
          onSuccess={() => {
            fetchFines();
            setShowCollectionModal(false);
          }}
        />
      )}

      <ReasonDialog
        open={!!waiveTarget}
        title="Waive this fine?"
        message={
          waiveTarget
            ? `This clears the £${waiveTarget.amount.toFixed(2)} fine. It won't be collected.`
            : undefined
        }
        label="Reason for waiving"
        placeholder="e.g. hardship, agreed with parent…"
        confirmText="Waive fine"
        destructive
        busy={waiving}
        onCancel={() => setWaiveTarget(null)}
        onConfirm={confirmWaive}
      />
    </div>
  );
}
