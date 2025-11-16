// components/reports/AttendanceReportGenerator.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Download, FileText, Table } from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";
import { exportAttendanceToPDF } from "@/lib/utils/pdfExport";

interface AttendanceReportGeneratorProps {
  classes: Array<{ id: string; name: string }>;
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  }>;
}

export default function AttendanceReportGenerator({
  classes,
  students,
}: AttendanceReportGeneratorProps) {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const [filters, setFilters] = useState({
    class_id: "",
    student_id: "",
    from_date: "",
    to_date: "",
    status: "",
  });

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("attendance")
        .select(
          `
          *,
          students (
            id,
            first_name,
            last_name,
            student_number
          ),
          classes (
            id,
            name
          )
        `
        )
        .order("date", { ascending: false });

      // Apply filters
      if (filters.class_id) {
        query = query.eq("class_id", filters.class_id);
      }
      if (filters.student_id) {
        query = query.eq("student_id", filters.student_id);
      }
      if (filters.from_date) {
        query = query.gte("date", filters.from_date);
      }
      if (filters.to_date) {
        query = query.lte("date", filters.to_date);
      }
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate statistics
      const total = data?.length || 0;
      const present = data?.filter((a) => a.status === "present").length || 0;
      const absent = data?.filter((a) => a.status === "absent").length || 0;
      const late = data?.filter((a) => a.status === "late").length || 0;
      const excused = data?.filter((a) => a.status === "excused").length || 0;

      setReportData({
        records: data,
        statistics: {
          total,
          present,
          absent,
          late,
          excused,
          presentRate: total > 0 ? Math.round((present / total) * 100) : 0,
        },
      });
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData || !reportData.records) return;

    const headers = [
      "Date",
      "Student",
      "Student Number",
      "Class",
      "Status",
      "Notes",
    ];
    const rows = reportData.records.map((record: any) => [
      record.date,
      `${record.students?.first_name} ${record.students?.last_name}`,
      record.students?.student_number || "",
      record.classes?.name || "",
      record.status,
      record.notes || "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row: any[]) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const appliedFilters = {
      class_name: filters.class_id
        ? classes.find((c) => c.id === filters.class_id)?.name || null
        : null,
      student_name: filters.student_id
        ? (() => {
            const student = students.find((s) => s.id === filters.student_id);
            return student
              ? `${student.first_name} ${student.last_name}`
              : null;
          })()
        : null,
      from_date: filters.from_date || null,
      to_date: filters.to_date || null,
    };

    exportAttendanceToPDF({
      records: reportData.records,
      statistics: reportData.statistics,
      filters: appliedFilters,
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Class</label>
          <select
            name="class_id"
            value={filters.class_id}
            onChange={handleFilterChange}
            className="form-input"
          >
            <option value="">All Classes</option>
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
            name="student_id"
            value={filters.student_id}
            onChange={handleFilterChange}
            className="form-input"
          >
            <option value="">All Students</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="form-input"
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
            <option value="sick">Sick</option>
          </select>
        </div>

        <div>
          <label className="form-label">From Date</label>
          <input
            type="date"
            name="from_date"
            value={filters.from_date}
            onChange={handleFilterChange}
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">To Date</label>
          <input
            type="date"
            name="to_date"
            value={filters.to_date}
            onChange={handleFilterChange}
            className="form-input"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={generateReport}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold">
                {reportData.statistics.total}
              </p>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-green-700">
                {reportData.statistics.present}
              </p>
              <p className="text-sm text-green-600">Present</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-red-700">
                {reportData.statistics.absent}
              </p>
              <p className="text-sm text-red-600">Absent</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-orange-700">
                {reportData.statistics.late}
              </p>
              <p className="text-sm text-orange-600">Late</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">
                {reportData.statistics.presentRate}%
              </p>
              <p className="text-sm text-blue-600">Attendance Rate</p>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={exportToCSV}
              className="btn-outline flex items-center space-x-2"
            >
              <Table className="h-4 w-4" />
              <span>Export to Excel (CSV)</span>
            </button>
            <button
              onClick={exportToPDF}
              className="btn-outline flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Export to PDF</span>
            </button>
          </div>

          {/* Preview Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/50">
              <h4 className="font-semibold">Report Preview</h4>
              <p className="text-sm text-muted-foreground">
                Showing {reportData.records.length} records
              </p>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Student</th>
                    <th className="px-4 py-2 text-left">Class</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reportData.records.slice(0, 50).map((record: any) => (
                    <tr key={record.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2">
                        {formatDate(record.date, "short")}
                      </td>
                      <td className="px-4 py-2">
                        {record.students?.first_name}{" "}
                        {record.students?.last_name}
                        <span className="text-xs text-muted-foreground ml-2">
                          #{record.students?.student_number}
                        </span>
                      </td>
                      <td className="px-4 py-2">{record.classes?.name}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            record.status === "present"
                              ? "bg-green-100 text-green-800"
                              : record.status === "absent"
                              ? "bg-red-100 text-red-800"
                              : record.status === "late"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {record.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportData.records.length > 50 && (
                <div className="px-4 py-3 text-sm text-muted-foreground text-center border-t">
                  Showing first 50 of {reportData.records.length} records.
                  Export to see all.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
