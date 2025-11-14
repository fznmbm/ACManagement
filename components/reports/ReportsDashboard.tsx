// components/reports/ReportsDashboard.tsx
"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  Users,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import AttendanceReportGenerator from "./AttendanceReportGenerator";
import StudentReportGenerator from "./StudentReportGenerator";
import ClassReportGenerator from "./ClassReportGenerator";

interface ReportsDashboardProps {
  classes: Array<{ id: string; name: string }>;
  students: Array<{
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
  }>;
  stats: {
    totalStudents: number;
    totalClasses: number;
    lastAttendanceDate: string | null;
  };
  userRole: string;
}

type ReportType = "attendance" | "student" | "class" | "summary" | null;

export default function ReportsDashboard({
  classes,
  students,
  stats,
  userRole,
}: ReportsDashboardProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>(null);

  const reportTypes = [
    {
      id: "attendance" as ReportType,
      name: "Attendance Report",
      description:
        "Generate detailed attendance reports by class, date range, or student",
      icon: Calendar,
      color: "bg-blue-100 text-blue-600",
    },
    {
      id: "student" as ReportType,
      name: "Student Report",
      description:
        "Individual student reports with attendance, progress, and grades",
      icon: Users,
      color: "bg-green-100 text-green-600",
    },
    {
      id: "class" as ReportType,
      name: "Class Report",
      description:
        "Class overview with student list, attendance stats, and progress",
      icon: BookOpen,
      color: "bg-purple-100 text-purple-600",
    },
    {
      id: "summary" as ReportType,
      name: "Summary Report",
      description: "Overall system statistics and analytics (Coming Soon)",
      icon: TrendingUp,
      color: "bg-orange-100 text-orange-600",
      disabled: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-3xl font-bold mt-1">{stats.totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Classes</p>
              <p className="text-3xl font-bold mt-1">{stats.totalClasses}</p>
            </div>
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Last Attendance</p>
              <p className="text-lg font-bold mt-1">
                {stats.lastAttendanceDate
                  ? new Date(stats.lastAttendanceDate).toLocaleDateString()
                  : "No records"}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Report Type Selection */}
      {!selectedReport ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => !report.disabled && setSelectedReport(report.id)}
                disabled={report.disabled}
                className={`bg-card border border-border rounded-lg p-6 text-left hover:shadow-lg transition-all ${
                  report.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-primary"
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${report.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">
                      {report.name}
                      {report.disabled && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Coming Soon)
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                    {!report.disabled && (
                      <div className="flex items-center space-x-2 mt-3 text-primary">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Generate Report →
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">
              {reportTypes.find((r) => r.id === selectedReport)?.name}
            </h3>
            <button
              onClick={() => setSelectedReport(null)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Reports
            </button>
          </div>

          {/* Report Generators */}
          {selectedReport === "attendance" && (
            <AttendanceReportGenerator classes={classes} students={students} />
          )}
          {selectedReport === "student" && (
            <StudentReportGenerator students={students} classes={classes} />
          )}
          {selectedReport === "class" && (
            <ClassReportGenerator classes={classes} />
          )}
        </div>
      )}
    </div>
  );
}
