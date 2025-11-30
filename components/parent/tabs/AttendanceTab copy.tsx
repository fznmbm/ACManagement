"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Calendar, List, TrendingUp, CalendarDays } from "lucide-react";

interface AttendanceRecord {
  id: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  classes: {
    class_name: string;
  };
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  presentPercentage: number;
}

interface AttendanceTabProps {
  studentId: string;
}

export default function AttendanceTab({ studentId }: AttendanceTabProps) {
  const supabase = createClient();

  const [view, setView] = useState<"calendar" | "list">("list");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    presentPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    fetchAttendance();
  }, [studentId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      // Fetch all attendance records
      const { data, error } = await supabase
        .from("attendance")
        .select(
          `
    id,
    date,
    status,
    session_type,
    arrival_time,
    departure_time,
    notes,
    class_id,
    classes!inner (
      name,
      schedule
    )
  `
        )
        .eq("student_id", studentId)
        .order("date", { ascending: false });

      if (error) throw error;

      setAttendance(data || []);

      // Calculate statistics
      const total = data?.length || 0;
      const present = data?.filter((a) => a.status === "present").length || 0;
      const absent = data?.filter((a) => a.status === "absent").length || 0;
      const late = data?.filter((a) => a.status === "late").length || 0;
      const excused = data?.filter((a) => a.status === "excused").length || 0;
      const presentPercentage =
        total > 0 ? Math.round((present / total) * 100) : 0;

      setStats({
        total,
        present,
        absent,
        late,
        excused,
        presentPercentage,
      });
    } catch (err) {
      console.error("Error fetching attendance:", err);
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

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-500";
      case "absent":
        return "bg-red-500";
      case "late":
        return "bg-orange-500";
      case "excused":
        return "bg-blue-500";
      default:
        return "bg-slate-500";
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getAttendanceForDate = (day: number) => {
    const dateStr = `${selectedMonth.getFullYear()}-${String(
      selectedMonth.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return attendance.find((a) => a.date === dateStr);
  };

  const changeMonth = (direction: "prev" | "next") => {
    setSelectedMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
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
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Total Days
            </span>
            <CalendarDays className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats.total}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-600 dark:text-green-400">
              Present
            </span>
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
          </div>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.present}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-red-600 dark:text-red-400">
              Absent
            </span>
            <div className="h-2 w-2 rounded-full bg-red-500"></div>
          </div>
          <p className="text-2xl font-bold text-red-700 dark:text-red-400">
            {stats.absent}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-orange-200 dark:border-orange-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-orange-600 dark:text-orange-400">
              Late
            </span>
            <div className="h-2 w-2 rounded-full bg-orange-500"></div>
          </div>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
            {stats.late}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-600 dark:text-blue-400">
              Excused
            </span>
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
          </div>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
            {stats.excused}
          </p>
        </div>
      </div>

      {/* Attendance Rate */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800 p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Attendance Rate
            </h3>
          </div>
          <span className="text-3xl font-bold text-green-600 dark:text-green-400">
            {stats.presentPercentage}%
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${stats.presentPercentage}%` }}
          ></div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
          {stats.present} out of {stats.total} days present
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Attendance Records
        </h3>
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === "list"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <List className="h-4 w-4" />
            List
          </button>
          <button
            onClick={() => setView("calendar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === "calendar"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </button>
        </div>
      </div>

      {/* List View */}
      {view === "list" && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {attendance.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">
                No attendance records yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Day
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {attendance.map((record) => {
                    const date = new Date(record.date);
                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                          {date.toLocaleDateString("en-GB")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                          {date.toLocaleDateString("en-US", {
                            weekday: "long",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                          {record.classes?.class_name || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              record.status
                            )}`}
                          >
                            <div
                              className={`h-2 w-2 rounded-full ${getStatusDotColor(
                                record.status
                              )}`}
                            ></div>
                            {record.status.charAt(0).toUpperCase() +
                              record.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {view === "calendar" && (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => changeMonth("prev")}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg
                className="h-5 w-5 text-slate-600 dark:text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {selectedMonth.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <button
              onClick={() => changeMonth("next")}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg
                className="h-5 w-5 text-slate-600 dark:text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-slate-500 dark:text-slate-400 py-2"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {Array.from({ length: getFirstDayOfMonth(selectedMonth) }).map(
              (_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              )
            )}

            {/* Calendar days */}
            {Array.from({ length: getDaysInMonth(selectedMonth) }).map(
              (_, i) => {
                const day = i + 1;
                const attendanceRecord = getAttendanceForDate(day);
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === selectedMonth.getMonth() &&
                  new Date().getFullYear() === selectedMonth.getFullYear();

                return (
                  <div
                    key={day}
                    className={`aspect-square flex items-center justify-center rounded-lg text-sm ${
                      isToday ? "ring-2 ring-primary" : ""
                    } ${
                      attendanceRecord
                        ? attendanceRecord.status === "present"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium"
                          : attendanceRecord.status === "absent"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium"
                          : attendanceRecord.status === "late"
                          ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-medium"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {day}
                  </div>
                );
              }
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Legend:
            </span>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Present
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Absent
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Late
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Excused
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
