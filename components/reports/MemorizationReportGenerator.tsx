// components/reports/MemorizationReportGenerator.tsx
"use client";

import { useState } from "react";
import { Download, Loader2, Brain, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { exportMemorizationToPDF } from "@/lib/utils/pdfExport";

interface MemorizationReportGeneratorProps {
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  }>;
}

export default function MemorizationReportGenerator({
  students,
}: MemorizationReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [itemType, setItemType] = useState("");
  const [status, setStatus] = useState("");
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      // First get student_memorization data
      let query = supabase
        .from("student_memorization")
        .select("*")
        .order("updated_at", { ascending: false });

      if (selectedStudent) {
        query = query.eq("student_id", selectedStudent);
      }
      if (status) {
        query = query.eq("status", status);
      }

      const { data: memorizationData, error: memError } = await query;
      if (memError) throw memError;

      if (!memorizationData || memorizationData.length === 0) {
        setReportData([]);
        return;
      }

      // Get student details
      const studentIds = [
        ...new Set(memorizationData.map((m) => m.student_id)),
      ];
      const { data: students } = await supabase
        .from("students")
        .select("id, first_name, last_name, student_number")
        .in("id", studentIds);

      // Get memorization items
      const itemIds = [
        ...new Set(memorizationData.map((m) => m.memorization_item_id)),
      ];
      const { data: items } = await supabase
        .from("memorization_items")
        .select("id, title, title_arabic, item_type")
        .in("id", itemIds);

      // Combine the data
      const combinedData = memorizationData.map((mem) => ({
        ...mem,
        students: students?.find((s) => s.id === mem.student_id),
        memorization_items: items?.find(
          (i) => i.id === mem.memorization_item_id
        ),
      }));

      // Filter by item type if selected
      const finalData = itemType
        ? combinedData.filter(
            (item) => item.memorization_items?.item_type === itemType
          )
        : combinedData;

      setReportData(finalData);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!reportData || reportData.length === 0)
      return { total: 0, mastered: 0, learning: 0 };

    const mastered = reportData.filter(
      (item: any) => item.status === "mastered"
    ).length;
    const learning = reportData.filter(
      (item: any) => item.status === "learning"
    ).length;

    return {
      total: reportData.length,
      mastered,
      learning,
    };
  };

  const exportToPDF = () => {
    if (!reportData || reportData.length === 0) return;

    const appliedFilters = {
      student_name: selectedStudent
        ? students.find((s) => s.id === selectedStudent)?.first_name +
          " " +
          students.find((s) => s.id === selectedStudent)?.last_name
        : undefined,
      item_type: itemType || undefined,
      status: status || undefined,
    };

    exportMemorizationToPDF({
      records: reportData,
      statistics: stats,
      filters: appliedFilters,
    });
  };

  const stats = calculateStats();

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      not_started:
        "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      learning: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      memorized:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      mastered:
        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
    return badges[status] || badges.not_started;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <label className="form-label">Item Type</label>
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            className="form-input"
          >
            <option value="">All Types</option>
            <option value="dua">Duas</option>
            <option value="surah">Surahs</option>
            <option value="hadith">Hadiths</option>
          </select>
        </div>

        <div>
          <label className="form-label">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="form-input"
          >
            <option value="">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="learning">Learning</option>
            <option value="memorized">Memorized</option>
            <option value="mastered">Mastered</option>
          </select>
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
            <Brain className="h-4 w-4 mr-2" />
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
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total Items</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Mastered</p>
                <p className="text-xl font-bold text-purple-600">
                  {stats.mastered}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">In Progress</p>
                <p className="text-xl font-bold text-blue-600">
                  {stats.learning}
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
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Proficiency
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Last Updated
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
                      {item.students?.first_name} {item.students?.last_name}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.memorization_items?.title}
                      {item.memorization_items?.title_arabic && (
                        <div className="text-xs text-muted-foreground rtl">
                          {item.memorization_items.title_arabic}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">
                      {item.memorization_items?.item_type}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.proficiency_rating
                        ? `${item.proficiency_rating}/5`
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(item.updated_at).toLocaleDateString()}
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
