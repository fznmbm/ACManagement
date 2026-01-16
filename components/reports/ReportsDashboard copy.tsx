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
  Brain,
  Award,
  AlertTriangle,
} from "lucide-react";
import AttendanceReportGenerator from "./AttendanceReportGenerator";
import StudentReportGenerator from "./StudentReportGenerator";
import ClassReportGenerator from "./ClassReportGenerator";
import Link from "next/link";
import AcademicReportGenerator from "./AcademicReportGenerator";
import MemorizationReportGenerator from "./MemorizationReportGenerator";
import CertificateReportGenerator from "./CertificateReportGenerator";
import LowAttendanceReportGenerator from "./LowAttendanceReportGenerator";

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

type ReportType =
  | "attendance"
  | "student"
  | "class"
  | "academic"
  | "memorization"
  | "certificates"
  | "low_attendance"
  | null;

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
      id: "academic" as ReportType,
      name: "Academic Progress Report",
      description: "Track assessment scores and grades by subject and student",
      icon: TrendingUp,
      color: "bg-orange-100 text-orange-600",
    },
    {
      id: "memorization" as ReportType,
      name: "Memorization Progress Report",
      description: "Track Duas, Surahs, and Hadiths completion progress",
      icon: Brain,
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      id: "certificates" as ReportType,
      name: "Certificate Report",
      description: "List of all issued certificates with student details",
      icon: Award,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      id: "low_attendance" as ReportType,
      name: "Low Attendance Alert",
      description: "Students with attendance below threshold percentage",
      icon: AlertTriangle,
      color: "bg-red-100 text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/students"
          className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer hover:border-primary"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-3xl font-bold mt-1">{stats.totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </Link>

        <Link
          href="/classes"
          className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer hover:border-primary"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Classes</p>
              <p className="text-3xl font-bold mt-1">{stats.totalClasses}</p>
            </div>
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
        </Link>

        <Link
          href="/attendance"
          className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer hover:border-primary"
        >
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
        </Link>
      </div>

      {/* Report Type Selection */}
      {!selectedReport ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <div
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className="bg-card border border-border rounded-lg p-6 text-left hover:shadow-lg transition-all cursor-pointer hover:border-primary"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${report.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">
                      {report.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {report.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-3 text-primary">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Generate Report →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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
          {selectedReport === "academic" && (
            // <div className="text-center py-8 text-muted-foreground">
            //   <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
            //   <p>Academic Progress Report - Coming Soon</p>
            // </div>
            <AcademicReportGenerator students={students} classes={classes} />
          )}
          {selectedReport === "memorization" && (
            // <div className="text-center py-8 text-muted-foreground">
            //   <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            //   <p>Memorization Progress Report - Coming Soon</p>
            // </div>
            <MemorizationReportGenerator students={students} />
          )}
          {selectedReport === "certificates" && (
            // <div className="text-center py-8 text-muted-foreground">
            //   <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
            //   <p>Certificate Report - Coming Soon</p>
            // </div>
            <CertificateReportGenerator students={students} />
          )}
          {selectedReport === "low_attendance" && (
            // <div className="text-center py-8 text-muted-foreground">
            //   <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            //   <p>Low Attendance Alert Report - Coming Soon</p>
            // </div>
            <LowAttendanceReportGenerator
              classes={classes}
              students={students}
            />
          )}
        </div>
      )}
    </div>
  );
}
