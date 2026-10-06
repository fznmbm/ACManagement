"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatMoney } from "@/lib/utils/helpers";
import {
  User,
  Calendar,
  GraduationCap,
  BookOpen,
  DollarSign,
  AlertCircle,
  Award,
  ArrowLeft,
  MessageSquare,
  ChevronRight,
  ScrollText,
} from "lucide-react";
import AttendanceTab from "@/components/parent/tabs/AttendanceTab";
import GradesTab from "@/components/parent/tabs/GradesTab";
import MemorizationTab from "@/components/parent/tabs/MemorizationTab";
import FinancesTab from "@/components/parent/tabs/FinancesTab";
import CertificatesTab from "@/components/parent/tabs/CertificatesTab";
import ParentPrayerSheet from "@/components/prayer/ParentPrayerSheet";
import FeedbackTab from "@/components/parent/tabs/FeedbackTab";

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  status: string;
  class_id?: string;
  classes?: {
    class_name: string;
  };
  enrollment_date: string;
}

type TabType =
  | "overview"
  | "attendance"
  | "progress"
  | "finances"
  | "feedback"
  | "prayers";

type ProgressView = "grades" | "memorization" | "certificates";

interface Snapshot {
  attendance: number | null;
  grade: number | null;
  balance: number | null;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [progressView, setProgressView] = useState<ProgressView>("grades");
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState<Snapshot>({
    attendance: null,
    grade: null,
    balance: null,
  });

  const [parentLink, setParentLink] = useState<{
    can_view_attendance: boolean;
    can_view_grades: boolean;
    can_view_financial: boolean;
    relationship: string;
    is_primary: boolean;
  } | null>(null);
  const [tabUnread, setTabUnread] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/parent/login");
          return;
        }

        const studentId = params.id as string;
        const { data: unreadData } = await supabase
          .from("parent_notifications")
          .select("type")
          .eq("parent_user_id", user.id)
          .eq("student_id", studentId)
          .eq("is_read", false);

        // Map notification types to the (new) top tabs
        const tabCounts: Record<string, number> = {};
        unreadData?.forEach((n) => {
          if (["announcement", "academic_note", "feedback"].includes(n.type)) {
            tabCounts["feedback"] = (tabCounts["feedback"] || 0) + 1;
          } else if (["fee_alert", "fine"].includes(n.type)) {
            tabCounts["finances"] = (tabCounts["finances"] || 0) + 1;
          }
        });
        setTabUnread(tabCounts);

        // Verify parent has access to this student
        const { data: link, error: linkError } = await supabase
          .from("parent_student_links")
          .select(
            `
    can_view_attendance,
    can_view_grades,
    can_view_financial,
    relationship,
    is_primary
  `,
          )
          .eq("parent_user_id", user.id)
          .eq("student_id", params.id)
          .single();

        if (linkError || !link) {
          setError("You do not have access to this student");
          setLoading(false);
          return;
        }

        setParentLink(link);

        // Fetch student details
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select(
            `
    id,
    student_number,
    first_name,
    last_name,
    date_of_birth,
    gender,
    status,
    class_id,
    enrollment_date
  `,
          )
          .eq("id", params.id)
          .single();

        if (studentError) {
          setError("Failed to load student details");
          setLoading(false);
          return;
        }

        const student: Student = {
          ...studentData,
          classes: undefined,
        };

        if (student.class_id) {
          const { data: classData } = await supabase
            .from("classes")
            .select("name")
            .eq("id", student.class_id)
            .single();
          if (classData) {
            student.classes = { class_name: classData.name };
          }
        }

        setStudent(student);

        // Overview snapshot stats (respecting this parent's permissions)
        const snap: Snapshot = { attendance: null, grade: null, balance: null };
        if (link.can_view_attendance) {
          const { data: att } = await supabase
            .from("attendance")
            .select("status")
            .eq("student_id", studentId);
          if (att && att.length > 0) {
            snap.attendance = Math.round(
              (att.filter((a) => a.status === "present").length / att.length) *
                100,
            );
          }
        }
        if (link.can_view_grades) {
          const { data: gr } = await supabase
            .from("academic_progress")
            .select("percentage")
            .eq("student_id", studentId);
          if (gr && gr.length > 0) {
            snap.grade = Math.round(
              gr.reduce((s, g: any) => s + Number(g.percentage || 0), 0) /
                gr.length,
            );
          }
        }
        if (link.can_view_financial) {
          const { data: fn } = await supabase
            .from("fines")
            .select("amount")
            .eq("student_id", studentId)
            .eq("status", "pending");
          const finesOwed = (fn || []).reduce(
            (s, f: any) => s + Number(f.amount || 0),
            0,
          );
          const { data: inv } = await supabase
            .from("fee_invoices")
            .select("amount_due, amount_paid")
            .eq("student_id", studentId)
            .in("status", ["pending", "partial", "overdue"]);
          const invOwed = (inv || []).reduce(
            (s, i: any) =>
              s +
              Math.max(
                0,
                Number(i.amount_due || 0) - Number(i.amount_paid || 0),
              ),
            0,
          );
          snap.balance = finesOwed + invOwed;
        }
        setSnapshot(snap);

        // Unseen class-feedback sessions feed the Feedback badge
        if (student.class_id) {
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          const { data: sessions } = await supabase
            .from("class_feedback_sessions")
            .select("id")
            .eq("class_id", student.class_id)
            .eq("status", "completed")
            .gte("session_date", ninetyDaysAgo.toISOString().split("T")[0]);

          if (sessions && sessions.length > 0) {
            const sessionIds = sessions.map((s) => s.id);
            const { data: views } = await supabase
              .from("parent_feedback_session_views")
              .select("session_id")
              .eq("parent_user_id", user.id)
              .in("session_id", sessionIds);
            const viewedIds = new Set((views || []).map((v) => v.session_id));
            const unseenCount = sessionIds.filter(
              (id) => !viewedIds.has(id),
            ).length;
            if (unseenCount > 0) {
              setTabUnread((prev) => ({
                ...prev,
                feedback: (prev.feedback || 0) + unseenCount,
              }));
            }
          }
        }
      } catch (err) {
        console.error("Error fetching student:", err);
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [params.id, router, supabase]);

  // Persist read-state when the parent actually views the content.
  const markRead = async (types: string[]) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("parent_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("parent_user_id", user.id)
      .eq("student_id", params.id)
      .in("type", types)
      .eq("is_read", false);
  };

  const openTab = (id: TabType) => {
    setActiveTab(id);
    setTabUnread((prev) => ({ ...prev, [id]: 0 }));
    if (id === "finances") markRead(["fine", "fee_alert"]);
  };

  const openProgressView = (v: ProgressView) => {
    setProgressView(v);
    if (v === "certificates") markRead(["certificate"]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">
            Loading student details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {error || "Student not found"}
          </p>
          <button
            onClick={() => router.push("/parent/dashboard")}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: User, show: true },
    {
      id: "attendance" as TabType,
      label: "Attendance",
      icon: Calendar,
      show: !!parentLink?.can_view_attendance,
    },
    {
      id: "progress" as TabType,
      label: "Progress",
      icon: GraduationCap,
      show: !!parentLink?.can_view_grades,
    },
    {
      id: "finances" as TabType,
      label: "Finances",
      icon: DollarSign,
      show: !!parentLink?.can_view_financial,
    },
    {
      id: "feedback" as TabType,
      label: "Feedback",
      icon: MessageSquare,
      show: true,
    },
  ];
  const visibleTabs = tabs.filter((t) => t.show);
  const allTabsVisible = visibleTabs.length === tabs.length;

  const progressTabs: { id: ProgressView; label: string; icon: any }[] = [
    { id: "grades", label: "Grades", icon: GraduationCap },
    { id: "memorization", label: "Memorization", icon: BookOpen },
    { id: "certificates", label: "Certificates", icon: Award },
  ];

  // Overview quick links (only to sections the parent can see)
  const quickLinks = [
    parentLink?.can_view_attendance && {
      id: "attendance" as TabType,
      label: "Attendance",
      desc: "Register history",
      icon: Calendar,
    },
    parentLink?.can_view_grades && {
      id: "progress" as TabType,
      label: "Progress",
      desc: "Grades, memorization & certificates",
      icon: GraduationCap,
    },
    parentLink?.can_view_financial && {
      id: "finances" as TabType,
      label: "Finances",
      desc: "Invoices & fines",
      icon: DollarSign,
    },
    {
      id: "feedback" as TabType,
      label: "Feedback",
      desc: "Notes & announcements",
      icon: MessageSquare,
    },
    {
      id: "prayers" as TabType,
      label: "Prayer sheet",
      desc: "Daily prayer tracker",
      icon: ScrollText,
    },
  ].filter(Boolean) as {
    id: TabType;
    label: string;
    desc: string;
    icon: any;
  }[];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => router.push("/parent/dashboard")}
            className="flex items-center text-slate-600 dark:text-slate-400 hover:text-primary mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {student.first_name} {student.last_name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Student #:{" "}
                  <span className="font-medium text-slate-900 dark:text-white">
                    {student.student_number}
                  </span>
                </span>
                {student.classes && (
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Class:{" "}
                    <span className="font-medium text-slate-900 dark:text-white">
                      {student.classes.class_name}
                    </span>
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    student.status === "active"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {student.status.charAt(0).toUpperCase() +
                    student.status.slice(1)}
                </span>
                {parentLink && (
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Relationship:{" "}
                    <span className="font-medium text-slate-900 dark:text-white capitalize">
                      {parentLink.relationship}
                    </span>
                    {parentLink.is_primary && (
                      <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 rounded text-xs font-medium">
                        Primary Contact
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top tabs — 5 sections, fit without scrolling */}
        <div className="max-w-7xl mx-auto px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => openTab(tab.id)}
                  className={`relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-primary text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {(tabUnread[tab.id] || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {tabUnread[tab.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {!allTabsVisible && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-400">
                  Limited Access
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Some sections are hidden based on your access permissions.
                  Contact an administrator if you need access to additional
                  information.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {parentLink?.can_view_attendance && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Attendance
                  </p>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      snapshot.attendance != null && snapshot.attendance < 75
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {snapshot.attendance != null
                      ? `${snapshot.attendance}%`
                      : "—"}
                  </p>
                </div>
              )}
              {parentLink?.can_view_grades && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Average grade
                  </p>
                  <p className="text-2xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                    {snapshot.grade != null ? `${snapshot.grade}%` : "—"}
                  </p>
                </div>
              )}
              {parentLink?.can_view_financial && (
                <div
                  className={`rounded-xl border p-4 ${
                    snapshot.balance && snapshot.balance > 0
                      ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Balance due
                  </p>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      snapshot.balance && snapshot.balance > 0
                        ? "text-red-600 dark:text-red-400"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {snapshot.balance != null
                      ? formatMoney(snapshot.balance)
                      : "—"}
                  </p>
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quickLinks.map((q) => {
                const Icon = q.icon;
                return (
                  <button
                    key={q.id}
                    onClick={() => openTab(q.id)}
                    className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-primary transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {q.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {q.desc}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ATTENDANCE */}
        {activeTab === "attendance" && (
          <AttendanceTab studentId={params.id as string} />
        )}

        {/* PROGRESS = Grades + Memorization + Certificates */}
        {activeTab === "progress" && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {progressTabs.map((pt) => {
                const Icon = pt.icon;
                return (
                  <button
                    key={pt.id}
                    onClick={() => openProgressView(pt.id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium border transition-colors ${
                      progressView === pt.id
                        ? "bg-primary/10 text-primary border-primary/40"
                        : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary/40"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {pt.label}
                  </button>
                );
              })}
            </div>
            {progressView === "grades" && (
              <GradesTab studentId={params.id as string} />
            )}
            {progressView === "memorization" && (
              <MemorizationTab studentId={params.id as string} />
            )}
            {progressView === "certificates" && (
              <CertificatesTab studentId={params.id as string} />
            )}
          </div>
        )}

        {/* FINANCES (Fees + Fines inside) */}
        {activeTab === "finances" && (
          <FinancesTab studentId={params.id as string} />
        )}

        {/* FEEDBACK */}
        {activeTab === "feedback" && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <FeedbackTab studentId={params.id as string} />
          </div>
        )}

        {/* PRAYERS (reached from Overview) */}
        {activeTab === "prayers" && student && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <ParentPrayerSheet
              studentId={params.id as string}
              studentName={`${student.first_name} ${student.last_name}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
