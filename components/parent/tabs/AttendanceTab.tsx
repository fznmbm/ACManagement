"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Attendance {
  id: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  session_type: string;
  arrival_time?: string;
  departure_time?: string;
  notes?: string;
  class_id?: string;
  classes?: {
    name: string;
    schedule: any;
  } | null;
}

interface AttendanceStats {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;
}

interface AttendanceTabProps {
  studentId: string;
}

export default function AttendanceTab({ studentId }: AttendanceTabProps) {
  const supabase = createClient();

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalDays: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendanceRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  useEffect(() => {
    fetchAttendance();
  }, [studentId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      console.log("🔍 Fetching attendance for student:", studentId);

      // Fetch attendance first
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId)
        .order("date", { ascending: false });

      if (attendanceError) {
        console.error("❌ Error fetching attendance:", attendanceError);
        throw attendanceError;
      }

      console.log("📊 Attendance data:", attendanceData);

      // Get unique class IDs
      const classIds = Array.from(
        new Set(
          attendanceData?.map((a) => a.class_id).filter((id) => id != null)
        )
      );

      console.log("📚 Class IDs:", classIds);

      // Fetch classes separately
      let classesMap = new Map();
      if (classIds.length > 0) {
        const { data: classesData, error: classesError } = await supabase
          .from("classes")
          .select("id, name, schedule, description")
          .in("id", classIds);

        console.log("📚 Classes data:", classesData, "Error:", classesError);

        if (classesData) {
          classesData.forEach((cls) => {
            classesMap.set(cls.id, cls);
          });
        }
      }

      // Combine data
      const combinedData =
        attendanceData?.map((record) => ({
          ...record,
          classes: record.class_id
            ? classesMap.get(record.class_id) || null
            : null,
        })) || [];

      console.log("✅ Combined attendance data:", combinedData);

      setAttendance(combinedData);

      // Calculate statistics
      const totalDays = combinedData.length;
      const present = combinedData.filter((a) => a.status === "present").length;
      const absent = combinedData.filter((a) => a.status === "absent").length;
      const late = combinedData.filter((a) => a.status === "late").length;
      const excused = combinedData.filter((a) => a.status === "excused").length;
      const attendanceRate =
        totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

      setStats({
        totalDays,
        present,
        absent,
        late,
        excused,
        attendanceRate,
      });
    } catch (err) {
      console.error("❌ Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
      case "absent":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      case "late":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400";
      case "excused":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return <CheckCircle className="h-4 w-4" />;
      case "absent":
        return <XCircle className="h-4 w-4" />;
      case "late":
        return <Clock className="h-4 w-4" />;
      case "excused":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.totalDays}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Total Days
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.present}
          </p>
          <p className="text-sm text-green-600 dark:text-green-500">Present</p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
            {stats.absent}
          </p>
          <p className="text-sm text-red-600 dark:text-red-500">Absent</p>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
            {stats.late}
          </p>
          <p className="text-sm text-orange-600 dark:text-orange-500">Late</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {stats.excused}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-500">Excused</p>
        </div>
      </div>

      {/* Attendance Rate */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
            Attendance Rate
          </h3>
          <span className="text-3xl font-bold text-green-700 dark:text-green-400">
            {stats.attendanceRate}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${stats.attendanceRate}%` }}
          ></div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          {stats.present} out of {stats.totalDays} days present
        </p>
      </div>

      {/* Attendance Records */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Attendance Records
        </h3>

        {attendance.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
            <Calendar className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">
              No attendance records yet
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {attendance.map((record) => (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        {new Date(record.date).toLocaleDateString("en-GB", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {record.classes?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(
                            record.status
                          )}`}
                        >
                          {getStatusIcon(record.status)}
                          {record.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {record.arrival_time || "-"}
                        {record.departure_time && ` - ${record.departure_time}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {record.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
