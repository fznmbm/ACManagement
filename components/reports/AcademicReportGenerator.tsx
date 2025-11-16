// components/reports/AcademicReportGenerator.tsx
"use client";

import { useState } from "react";
import { Download, Loader2, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AcademicReportGeneratorProps {
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  }>;
  classes: Array<{ id: string; name: string }>;
}

export default function AcademicReportGenerator({
  students,
  classes,
}: AcademicReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      let query = supabase
        .from("academic_progress")
        .select(
          `
    *,
    students (first_name, last_name, student_number),
    subjects (name)
  `
        )
        .order("assessment_date", { ascending: false });

      if (selectedStudent) {
        query = query.eq("student_id", selectedStudent);
      }
      if (selectedClass) {
        query = query.eq("class_id", selectedClass);
      }
      if (dateFrom) {
        query = query.gte("assessment_date", dateFrom);
      }
      if (dateTo) {
        query = query.lte("assessment_date", dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      setReportData(data);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const calculateAverage = () => {
    if (!reportData || reportData.length === 0) return 0;
    const total = reportData.reduce(
      (sum: number, item: any) => sum + (item.percentage || 0),
      0
    );
    return (total / reportData.length).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="form-label">Student</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="form-input"
          >
            <option value="">All Students</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name} (
                {student.student_number})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="form-label">Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
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
          <label className="form-label">From Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">To Date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={generateReport}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Generating...
          </>
        ) : (
          <>
            <TrendingUp className="h-4 w-4 mr-2" />
            Generate Report
          </>
        )}
      </button>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Assessments</p>
                <p className="text-xl font-bold">{reportData.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Average Score</p>
                <p className="text-xl font-bold">{calculateAverage()}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Students</p>
                <p className="text-xl font-bold">
                  {new Set(reportData.map((r: any) => r.student_id)).size}
                </p>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Assessment
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((item: any, index: number) => (
                  <tr
                    key={index}
                    className="border-t border-border hover:bg-accent"
                  >
                    <td className="px-4 py-3 text-sm">
                      {new Date(item.assessment_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.students?.first_name} {item.students?.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm">{item.subjects?.name}</td>
                    <td className="px-4 py-3 text-sm">
                      {item.assessment_type}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.score}/{item.max_score}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`font-semibold ${
                          item.percentage >= 60
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
