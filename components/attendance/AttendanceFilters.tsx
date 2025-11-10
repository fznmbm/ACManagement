// components/attendance/AttendanceFilters.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X, Download } from "lucide-react";

interface AttendanceFiltersProps {
  classes: Array<{ id: string; name: string }>;
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  }>;
}

export default function AttendanceFilters({
  classes,
  students,
}: AttendanceFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedClass, setSelectedClass] = useState(
    searchParams.get("class") || ""
  );
  const [selectedStudent, setSelectedStudent] = useState(
    searchParams.get("student") || ""
  );
  const [fromDate, setFromDate] = useState(searchParams.get("from") || "");
  const [toDate, setToDate] = useState(searchParams.get("to") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (selectedClass) params.set("class", selectedClass);
    if (selectedStudent) params.set("student", selectedStudent);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (status) params.set("status", status);

    router.push(`/attendance/history?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedClass("");
    setSelectedStudent("");
    setFromDate("");
    setToDate("");
    setStatus("");
    router.push("/attendance/history");
  };

  const hasActiveFilters =
    selectedClass || selectedStudent || fromDate || toDate || status;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-destructive hover:underline flex items-center space-x-1"
          >
            <X className="h-3 w-3" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="form-label text-xs">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="form-input text-sm"
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
          <label className="form-label text-xs">Student</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="form-input text-sm"
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
          <label className="form-label text-xs">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="form-input text-sm"
          />
        </div>

        <div>
          <label className="form-label text-xs">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="form-input text-sm"
          />
        </div>

        <div>
          <label className="form-label text-xs">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="form-input text-sm"
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
            <option value="sick">Sick</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 mt-4">
        <button onClick={applyFilters} className="btn-primary text-sm">
          Apply Filters
        </button>
        <button
          className="btn-outline text-sm flex items-center space-x-1"
          title="Export (Coming Soon)"
        >
          <Download className="h-3 w-3" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
