// app/(dashboard)/fines/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, Eye, Settings, TrendingUp } from "lucide-react";
import FineCollectionModal from "@/components/fines/FineCollectionModal";
import { formatDate } from "@/lib/utils/helpers";
import { Fine, StudentFineData } from "@/types/fines";

// interface Fine {
//   id: string;
//   student_id: string;
//   class_id: string; // Add this
//   fine_type: string;
//   amount: number;
//   status: string;
//   issued_date: string;
//   paid_date?: string;
//   payment_method?: string;
//   notes?: string;
//   students: {
//     first_name: string;
//     last_name: string;
//     student_number: string;
//   };
//   collected_by_profile?: {
//     full_name: string;
//   };
// }

interface FineSettings {
  fine_type: string;
  amount: number;
  is_active: boolean;
  description: string;
}

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

export default function FinesPage() {
  const [fines, setFines] = useState<Fine[]>([]);
  // const [fineSettings, setFineSettings] = useState<FineSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] =
    useState<StudentFineData | null>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [pendingFines, setPendingFines] = useState<Fine[]>([]);
  //const [showSettings, setShowSettings] = useState(false);
  const [classFilter, setClassFilter] = useState("");
  const [studentFilter, setStudentFilter] = useState("");
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);

  const supabase = createClient();

  useEffect(() => {
    fetchFines();
    //fetchFineSettings();
  }, []);

  const fetchFines = async () => {
    try {
      setLoading(true);
      // Get fines first
      let fineQuery = supabase
        .from("fines")
        .select("*")
        .order("issued_date", { ascending: false });

      // Apply date filters
      if (dateFromFilter) {
        fineQuery = fineQuery.gte("issued_date", dateFromFilter);
      }
      if (dateToFilter) {
        fineQuery = fineQuery.lte("issued_date", dateToFilter);
      }
      if (studentFilter) {
        fineQuery = fineQuery.eq("student_id", studentFilter);
      }

      const { data: finesData, error: finesError } = await fineQuery;
      if (finesError) throw finesError;

      // Get students data separately
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("id, first_name, last_name, student_number, class_id");

      if (studentsError) throw studentsError;

      // Combine the data
      const finesWithStudents = (finesData || [])
        .map((fine) => ({
          ...fine,
          students: studentsData?.find(
            (student) => student.id === fine.student_id
          ),
        }))
        .filter((fine) => fine.students); // Only include fines with valid student data

      // Apply class filter
      let filteredData = finesWithStudents;
      if (classFilter) {
        filteredData = filteredData.filter(
          (fine) => fine.students?.class_id === classFilter
        );
      }

      setFines(filteredData);
    } catch (error) {
      console.error("Error fetching fines:", error);
    } finally {
      setLoading(false);
    }
  };

  //   const fetchFineSettings = async () => {
  //     try {
  //       const { data, error } = await supabase
  //         .from("fine_settings")
  //         .select("*")
  //         .order("fine_type");

  //       if (error) throw error;
  //       setFineSettings(data || []);
  //     } catch (error) {
  //       console.error("Error fetching fine settings:", error);
  //     }
  //   };

  //   const updateFineSettings = async (fineType: string, amount: number) => {
  //     try {
  //       const { error } = await supabase
  //         .from("fine_settings")
  //         .update({ amount })
  //         .eq("fine_type", fineType);

  //       if (error) throw error;
  //       fetchFineSettings();
  //       alert("Fine settings updated successfully");
  //     } catch (error) {
  //       console.error("Error updating fine settings:", error);
  //       alert("Failed to update fine settings");
  //     }
  //   };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchFines();
  }, [classFilter, studentFilter, dateFromFilter, dateToFilter]);

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

  // const handleCancelFine = async (fineId: string) => {
  //   if (!confirm("Cancel this fine? This action cannot be undone.")) return;

  //   try {
  //     const { error } = await supabase
  //       .from("fines")
  //       .update({ status: "cancelled", notes: "Cancelled by admin" })
  //       .eq("id", fineId);

  //     if (error) throw error;

  //     fetchFines(); // Refresh the list
  //     alert("Fine cancelled successfully");
  //   } catch (error) {
  //     console.error("Error cancelling fine:", error);
  //     alert("Failed to cancel fine");
  //   }
  // };

  const handleWaiveFine = async (fineId: string, amount: number) => {
    if (
      !confirm(
        `Waive this £${amount.toFixed(2)} fine? This action cannot be undone.`
      )
    )
      return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("fines")
        .update({
          status: "waived",
          collected_by: user?.id,
          notes: "Waived by admin",
        })
        .eq("id", fineId);

      if (error) throw error;

      fetchFines(); // Refresh the list
      alert("Fine waived successfully");
    } catch (error) {
      console.error("Error waiving fine:", error);
      alert("Failed to waive fine");
    }
  };

  const filteredFines = fines.filter((fine) => {
    if (filter !== "all" && fine.status !== filter) return false;
    // Class filtering is now handled at database level
    return true;
  });

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
    const headers = [
      "Student Number",
      "Student Name",
      "Fine Type",
      "Amount",
      "Status",
      "Issued Date",
      "Paid Date",
      "Payment Method",
      "Collected By",
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
      fine.collected_by_profile?.full_name || "",
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fine Management</h1>
          <p className="text-muted-foreground">
            Manage student fines and collection records
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn-outline flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button> */}
          <button
            onClick={exportToCSV}
            className="btn-outline flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total Fines</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
            {stats.pending}
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-500">
            Pending
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.paid}
          </p>
          <p className="text-sm text-green-600 dark:text-green-500">Paid</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {stats.waived}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-500">Waived</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
            £{stats.pendingAmount.toFixed(2)}
          </p>
          <p className="text-sm text-red-600 dark:text-red-500">Outstanding</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-primary">
            £{stats.collectedAmount.toFixed(2)}
          </p>
          <p className="text-sm text-primary">Collected</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Class</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="form-input"
            >
              <option value="">All Classes</option>
              {classes.map((cls: any) => (
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
              <option value="">All Students</option>
              {students.map((student: any) => (
                <option key={student.id} value={student.id}>
                  {student.first_name} {student.last_name} (#
                  {student.student_number})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">From Date</label>
            <input
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Fine Settings
      {showSettings && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Fine Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fineSettings.map((setting) => (
              <div
                key={setting.fine_type}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div>
                  <p className="font-medium capitalize">
                    {setting.fine_type} Fine
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">£</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={setting.amount}
                    onChange={(e) => {
                      const newAmount = parseFloat(e.target.value) || 0;
                      updateFineSettings(setting.fine_type, newAmount);
                    }}
                    className="w-20 px-2 py-1 border border-border rounded text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Filters */}
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium">Filter:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="form-input w-auto"
        >
          <option value="all">All Fines</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="waived">Waived</option>
        </select>
      </div>

      {/* Fines Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/50">
          <h3 className="font-semibold">
            Fine Records ({filteredFines.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
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
              {filteredFines.map((fine) => (
                <tr key={fine.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">
                        {fine.students?.first_name} {fine.students?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fine.students?.student_number}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{fine.fine_type}</td>
                  <td className="px-4 py-3 font-semibold">
                    £{fine.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        fine.status === "pending"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                          : fine.status === "paid"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                      }`}
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
                    <div className="flex items-center space-x-2">
                      {fine.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleViewStudentFines({
                                id: fine.student_id,
                                first_name: fine.students?.first_name,
                                last_name: fine.students?.last_name,
                                student_number: fine.students?.student_number,
                              })
                            }
                            className="text-primary hover:underline text-xs"
                          >
                            Collect
                          </button>
                          <button
                            //   onClick={() => handleCancelFine(fine.id)}
                            //   className="text-red-600 hover:underline text-xs"
                            // >
                            //   Cancel
                            onClick={() =>
                              handleWaiveFine(fine.id, fine.amount)
                            }
                            className="text-orange-600 dark:text-orange-400 hover:underline text-xs font-medium"
                          >
                            Waive
                          </button>
                        </>
                      )}
                      {fine.status === "paid" && (
                        <span className="text-green-600 text-xs">✓ Paid</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    </div>
  );
}
