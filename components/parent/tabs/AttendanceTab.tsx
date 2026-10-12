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
  notes?: string;
  class_id?: string;
  classes?: { name: string } | null;
}

interface AttendanceTabProps {
  studentId: string;
}

export default function AttendanceTab({ studentId }: AttendanceTabProps) {
  const supabase = createClient();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, [studentId]);

  const fetchAttendance = async () => {
    try {
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId)
        .order("date", { ascending: false });

      if (!data) {
        setLoading(false);
        return;
      }

      const classIds = [
        ...new Set(data.map((a) => a.class_id).filter(Boolean)),
      ];
      let classesMap = new Map();
      if (classIds.length > 0) {
        const { data: classes } = await supabase
          .from("classes")
          .select("id, name")
          .in("id", classIds);
        classes?.forEach((c) => classesMap.set(c.id, c));
      }

      setAttendance(
        data.map((r) => ({
          ...r,
          classes: r.class_id ? classesMap.get(r.class_id) || null : null,
        })),
      );
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const total = attendance.length;
  const present = attendance.filter((a) => a.status === "present").length;
  const absent = attendance.filter((a) => a.status === "absent").length;
  const late = attendance.filter((a) => a.status === "late").length;
  const excused = attendance.filter((a) => a.status === "excused").length;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "present":
        return {
          bg: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
          icon: <CheckCircle className="h-3.5 w-3.5" />,
        };
      case "absent":
        return {
          bg: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
          icon: <XCircle className="h-3.5 w-3.5" />,
        };
      case "late":
        return {
          bg: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
          icon: <Clock className="h-3.5 w-3.5" />,
        };
      case "excused":
        return {
          bg: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
          icon: <AlertCircle className="h-3.5 w-3.5" />,
        };
      default:
        return { bg: "bg-muted text-foreground", icon: null };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-10 text-center">
        <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">
          No attendance records yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact summary */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
            <span>{total} days total</span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              ✅ {present} present
            </span>
            {absent > 0 && (
              <span className="text-red-600 dark:text-red-400 font-medium">
                ❌ {absent} absent
              </span>
            )}
            {late > 0 && (
              <span className="text-orange-600 dark:text-orange-400 font-medium">
                ⏰ {late} late
              </span>
            )}
            {excused > 0 && (
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                ℹ️ {excused} excused
              </span>
            )}
          </div>
          <span
            className={`text-lg font-bold ${rate >= 75 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
          >
            {rate}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${rate >= 75 ? "bg-green-500" : "bg-red-500"}`}
            style={{ width: `${rate}%` }}
          />
        </div>
      </div>

      {/* Records */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="font-medium text-foreground text-sm">
            Attendance Records
          </h3>
        </div>
        <div className="divide-y divide-border">
          {attendance.map((record) => {
            const style = getStatusStyle(record.status);
            return (
              <div
                key={record.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {new Date(record.date).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {record.classes?.name && (
                    <p className="text-xs text-muted-foreground">
                      {record.classes.name}
                    </p>
                  )}
                  {record.notes && (
                    <p className="text-xs text-muted-foreground italic mt-0.5">
                      {record.notes}
                    </p>
                  )}
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${style.bg}`}
                >
                  {style.icon}
                  {record.status.charAt(0).toUpperCase() +
                    record.status.slice(1)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
