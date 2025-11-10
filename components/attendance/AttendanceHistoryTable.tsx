// components/attendance/AttendanceHistoryTable.tsx
"use client";

import { formatDate } from "@/lib/utils/helpers";
import { getAttendanceBadge } from "@/lib/utils/helpers";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  session_type: string;
  notes?: string;
  students: {
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  };
  classes: {
    id: string;
    name: string;
  } | null;
}

interface AttendanceHistoryTableProps {
  records: AttendanceRecord[];
}

export default function AttendanceHistoryTable({
  records,
}: AttendanceHistoryTableProps) {
  if (records.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          No attendance records found for the selected filters.
        </p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      present: "bg-green-100 text-green-800",
      absent: "bg-red-100 text-red-800",
      late: "bg-orange-100 text-orange-800",
      excused: "bg-blue-100 text-blue-800",
      sick: "bg-purple-100 text-purple-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Student #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Class
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Session
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {records.map((record) => (
              <tr
                key={record.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatDate(record.date, "short")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm font-medium">
                    {record.students.first_name} {record.students.last_name}
                  </p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono">
                  {record.students.student_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {record.classes?.name || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      record.status
                    )}`}
                  >
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                  {record.session_type}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {record.notes || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-border flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {records.length} record{records.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
