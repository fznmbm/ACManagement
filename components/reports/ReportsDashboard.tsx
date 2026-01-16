// components/reports/ReportsDashboard.tsx
"use client";

import { useState } from "react";
import {
  FileText,
  Calendar,
  Users,
  BookOpen,
  TrendingUp,
  Brain,
  Award,
  AlertTriangle,
  DollarSign,
  CreditCard,
  Percent,
  CheckSquare,
  CalendarCheck,
  UserCheck,
  Trophy,
} from "lucide-react";
import AttendanceReportGenerator from "./AttendanceReportGenerator";
import StudentReportGenerator from "./StudentReportGenerator";
import ClassReportGenerator from "./ClassReportGenerator";
import AcademicReportGenerator from "./AcademicReportGenerator";
import MemorizationReportGenerator from "./MemorizationReportGenerator";
import CertificateReportGenerator from "./CertificateReportGenerator";
import LowAttendanceReportGenerator from "./LowAttendanceReportGenerator";
import FeeCollectionReport from "./FeeCollectionReport";
import FineCollectionReport from "./FineCollectionReport";
import ComprehensiveFinancialReport from "./ComprehensiveFinancialReport";
import ApplicationStatsReport from "./ApplicationStatsReport";
import EventAttendanceReport from "./EventAttendanceReport";
import ParentEngagementReport from "./ParentEngagementReport";
import YearEndSummaryReport from "./YearEndSummaryReport";
import Link from "next/link";

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
  | "fee_collection"
  | "fine_collection"
  | "comprehensive_financial"
  | "application_stats"
  | "event_attendance"
  | "parent_engagement"
  | "year_end_summary"
  | null;

export default function ReportsDashboard({
  classes,
  students,
  stats,
  userRole,
}: ReportsDashboardProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>(null);

  // Categorized report types
  const reportCategories = {
    financial: [
      {
        id: "fee_collection" as ReportType,
        name: "Fee Collection Report",
        description:
          "Detailed fee invoices with collection rates and outstanding balances",
        icon: CreditCard,
        color:
          "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        badge: "NEW",
      },
      {
        id: "fine_collection" as ReportType,
        name: "Fine Collection Report",
        description:
          "Track fines issued, collected, waived, and pending by type and date",
        icon: AlertTriangle,
        color:
          "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
        badge: "NEW",
      },
      {
        id: "comprehensive_financial" as ReportType,
        name: "Comprehensive Financial Report",
        description:
          "Complete financial overview combining fees and fines with trends",
        icon: DollarSign,
        color:
          "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
        badge: "NEW",
      },
    ],
    academic: [
      {
        id: "attendance" as ReportType,
        name: "Attendance Report",
        description:
          "Generate detailed attendance reports by class, date range, or student",
        icon: Calendar,
        color:
          "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
      },
      {
        id: "student" as ReportType,
        name: "Student Report",
        description:
          "Individual student reports with attendance, progress, and grades",
        icon: Users,
        color:
          "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
      },
      {
        id: "class" as ReportType,
        name: "Class Report",
        description:
          "Class overview with student list, attendance stats, and progress",
        icon: BookOpen,
        color:
          "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
      },
      {
        id: "academic" as ReportType,
        name: "Academic Progress Report",
        description:
          "Track assessment scores and grades by subject and student",
        icon: TrendingUp,
        color:
          "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
      },
      {
        id: "memorization" as ReportType,
        name: "Memorization Progress Report",
        description: "Track Duas, Surahs, and Hadiths completion progress",
        icon: Brain,
        color:
          "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
      },
      {
        id: "certificates" as ReportType,
        name: "Certificate Report",
        description: "List of all issued certificates with student details",
        icon: Award,
        color:
          "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
      },
      {
        id: "low_attendance" as ReportType,
        name: "Low Attendance Alert",
        description: "Students with attendance below threshold percentage",
        icon: AlertTriangle,
        color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
      },
    ],
    administrative: [
      {
        id: "application_stats" as ReportType,
        name: "Application Statistics Report",
        description:
          "Track application pipeline, acceptance rates, and processing times",
        icon: CheckSquare,
        color:
          "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        badge: "NEW",
      },
      {
        id: "event_attendance" as ReportType,
        name: "Event Attendance Report",
        description:
          "RSVP tracking, capacity planning, and age breakdown for events",
        icon: CalendarCheck,
        color:
          "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
        badge: "NEW",
      },
      {
        id: "parent_engagement" as ReportType,
        name: "Parent Engagement Report",
        description:
          "Track parent portal usage and engagement metrics by class",
        icon: UserCheck,
        color:
          "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400",
        badge: "NEW",
      },
      {
        id: "year_end_summary" as ReportType,
        name: "Year-End Summary Report",
        description:
          "Comprehensive annual overview with all key metrics and achievements",
        icon: Trophy,
        color:
          "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
        badge: "NEW",
      },
    ],
  };

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
        <div className="space-y-8">
          {/* Financial Reports */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Financial Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Revenue tracking, fee collection, and financial analysis
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportCategories.financial.map((report) => {
                const Icon = report.icon;
                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className="bg-card border border-border rounded-lg p-6 text-left hover:shadow-lg transition-all cursor-pointer hover:border-primary group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-lg ${report.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      {report.badge && (
                        <span className="px-2 py-1 text-xs font-bold bg-primary text-primary-foreground rounded">
                          {report.badge}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {report.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-2 text-primary text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      <span>Generate Report →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Academic Reports */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Academic Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Attendance, grades, memorization, and student performance
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportCategories.academic.map((report) => {
                const Icon = report.icon;
                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className="bg-card border border-border rounded-lg p-6 text-left hover:shadow-lg transition-all cursor-pointer hover:border-primary group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-lg ${report.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    </div>
                    <h4 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {report.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-2 text-primary text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      <span>Generate Report →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Administrative Reports */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <CheckSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Administrative Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Applications, events, parent engagement, and annual summaries
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportCategories.administrative.map((report) => {
                const Icon = report.icon;
                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className="bg-card border border-border rounded-lg p-6 text-left hover:shadow-lg transition-all cursor-pointer hover:border-primary group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-lg ${report.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      {report.badge && (
                        <span className="px-2 py-1 text-xs font-bold bg-primary text-primary-foreground rounded">
                          {report.badge}
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {report.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-2 text-primary text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      <span>Generate Report →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">
              {
                [
                  ...reportCategories.financial,
                  ...reportCategories.academic,
                  ...reportCategories.administrative,
                ].find((r) => r.id === selectedReport)?.name
              }
            </h3>
            <button
              onClick={() => setSelectedReport(null)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
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
            <AcademicReportGenerator students={students} classes={classes} />
          )}
          {selectedReport === "memorization" && (
            <MemorizationReportGenerator students={students} />
          )}
          {selectedReport === "certificates" && (
            <CertificateReportGenerator students={students} />
          )}
          {selectedReport === "low_attendance" && (
            <LowAttendanceReportGenerator
              classes={classes}
              students={students}
            />
          )}
          {selectedReport === "fee_collection" && (
            <FeeCollectionReport classes={classes} students={students} />
          )}
          {selectedReport === "fine_collection" && (
            <FineCollectionReport classes={classes} students={students} />
          )}
          {selectedReport === "comprehensive_financial" && (
            <ComprehensiveFinancialReport />
          )}
          {selectedReport === "application_stats" && <ApplicationStatsReport />}
          {selectedReport === "event_attendance" && <EventAttendanceReport />}
          {selectedReport === "parent_engagement" && <ParentEngagementReport />}
          {selectedReport === "year_end_summary" && <YearEndSummaryReport />}
        </div>
      )}
    </div>
  );
}
