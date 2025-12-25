// components/reports/CertificateReportGenerator.tsx
"use client";

import { useState } from "react";
import { Download, Loader2, Award, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { exportCertificateToPDF } from "@/lib/utils/pdfExport";

interface CertificateReportGeneratorProps {
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  }>;
}

export default function CertificateReportGenerator({
  students,
}: CertificateReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [certificateType, setCertificateType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      let query = supabase
        .from("certificates")
        .select(
          `
          *,
          students (first_name, last_name, student_number)
        `
        )
        .order("issue_date", { ascending: false });

      if (selectedStudent) {
        query = query.eq("student_id", selectedStudent);
      }
      if (certificateType) {
        query = query.eq("certificate_type", certificateType);
      }
      if (dateFrom) {
        query = query.gte("issue_date", dateFrom);
      }
      if (dateTo) {
        query = query.lte("issue_date", dateTo);
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

  const getCertificateTypeName = (type: string) => {
    const types: Record<string, string> = {
      subject_completion: "Subject Completion",
      memorization_completion: "Memorization Completion",
      academic_excellence: "Academic Excellence",
      year_completion: "Year Completion",
    };
    return types[type] || type;
  };

  const exportToPDF = () => {
    if (!reportData || reportData.length === 0) return;

    const appliedFilters = {
      student_name: selectedStudent
        ? students.find((s) => s.id === selectedStudent)?.first_name +
          " " +
          students.find((s) => s.id === selectedStudent)?.last_name
        : undefined,
      certificate_type: certificateType
        ? getCertificateTypeName(certificateType)
        : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    };

    exportCertificateToPDF({
      records: reportData,
      statistics: {
        total: reportData.length,
        students: new Set(reportData.map((r: any) => r.student_id)).size,
      },
      filters: appliedFilters,
    });
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
          <label className="form-label">Certificate Type</label>
          <select
            value={certificateType}
            onChange={(e) => setCertificateType(e.target.value)}
            className="form-input"
          >
            <option value="">All Types</option>
            <option value="subject_completion">Subject Completion</option>
            <option value="memorization_completion">
              Memorization Completion
            </option>
            <option value="academic_excellence">Academic Excellence</option>
            <option value="year_completion">Year Completion</option>
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
            <Award className="h-4 w-4 mr-2" />
            Generate Report
          </>
        )}
      </button>

      {reportData && (
        <button
          onClick={exportToPDF}
          className="btn-outline flex items-center space-x-2"
        >
          <FileText className="h-4 w-4" />
          <span>Export PDF</span>
        </button>
      )}

      {/* Report Results */}
      {reportData && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold mb-2">Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Certificates</p>
                <p className="text-xl font-bold">{reportData.length}</p>
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
                    Certificate #
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Issue Date
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Details
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((cert: any, index: number) => (
                  <tr
                    key={index}
                    className="border-t border-border hover:bg-accent"
                  >
                    <td className="px-4 py-3 text-sm font-mono">
                      {cert.certificate_number}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {cert.students?.first_name} {cert.students?.last_name}
                      <div className="text-xs text-muted-foreground">
                        {cert.students?.student_number}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getCertificateTypeName(cert.certificate_type)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(cert.issue_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {cert.details || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Link
                        href={`/curriculum-assessment/certificates/view?id=${cert.id}`}
                        className="text-primary hover:underline text-xs"
                      >
                        View Certificate
                      </Link>
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
