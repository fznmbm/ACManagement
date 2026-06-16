"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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
  //arabic_name?: string;
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
  | "attendance"
  | "grades"
  | "memorization"
  | "finances"
  | "certificates"
  | "prayers"
  | "feedback";

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("attendance");
  const [error, setError] = useState("");

  // ADD THIS NEW LINE:
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
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/parent/login");
          return;
        }

        // Fetch unread counts per type BEFORE marking as read
        const studentId = params.id as string;
        const { data: unreadData } = await supabase
          .from("parent_notifications")
          .select("type")
          .eq("parent_user_id", user.id)
          .eq("student_id", studentId)
          .eq("is_read", false);

        // Map notification types to tabs
        const tabCounts: Record<string, number> = {};
        unreadData?.forEach((n) => {
          if (["announcement", "academic_note", "feedback"].includes(n.type)) {
            tabCounts["feedback"] = (tabCounts["feedback"] || 0) + 1;
          } else if (["fee_alert", "fine"].includes(n.type)) {
            tabCounts["finances"] = (tabCounts["finances"] || 0) + 1;
          } else if (n.type === "certificate") {
            tabCounts["certificates"] = (tabCounts["certificates"] || 0) + 1;
          }
        });
        setTabUnread(tabCounts);

        // Now mark all as read
        await supabase
          .from("parent_notifications")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("parent_user_id", user.id)
          .eq("student_id", studentId)
          .eq("is_read", false);

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

        // Store the permissions
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

        // Create properly typed student object
        const student: Student = {
          ...studentData,
          classes: undefined, // Initialize as undefined
        };

        // Fetch class name if assigned
        if (student.class_id) {
          const { data: classData } = await supabase
            .from("classes")
            .select("name")
            .eq("id", student.class_id)
            .single();

          if (classData) {
            student.classes = {
              class_name: classData.name, // Map name to class_name
            };
          }
        }

        setStudent(student);
      } catch (err) {
        console.error("Error fetching student:", err);
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [params.id, router, supabase]);

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

  // const tabs = [
  //   { id: "overview", label: "Overview", icon: User },
  //   { id: "attendance", label: "Attendance", icon: Calendar },
  //   { id: "grades", label: "Grades", icon: GraduationCap },
  //   { id: "memorization", label: "Memorization", icon: BookOpen },
  //   { id: "fees", label: "Fees", icon: DollarSign },
  //   { id: "fines", label: "Fines", icon: AlertCircle },
  //   { id: "certificates", label: "Certificates", icon: Award },
  // ];

  const tabs = [
    {
      id: "attendance" as TabType,
      label: "Attendance",
      icon: Calendar,
      alwaysShow: false,
      permission: parentLink?.can_view_attendance,
    },
    {
      id: "grades" as TabType,
      label: "Grades",
      icon: GraduationCap,
      alwaysShow: false,
      permission: parentLink?.can_view_grades,
    },
    {
      id: "memorization" as TabType,
      label: "Progress",
      icon: BookOpen,
      alwaysShow: false,
      permission: parentLink?.can_view_grades,
    },
    {
      id: "finances" as TabType,
      label: "Finances",
      icon: DollarSign,
      alwaysShow: false,
      permission: parentLink?.can_view_financial,
    },
    {
      id: "certificates" as TabType,
      label: "Certificates",
      icon: Award,
      alwaysShow: false,
      permission: parentLink?.can_view_grades,
    },
    {
      id: "prayers" as TabType,
      label: "Prayers",
      icon: BookOpen,
      alwaysShow: true,
    },
    {
      id: "feedback" as TabType,
      label: "Feedback",
      icon: MessageSquare,
      alwaysShow: true,
    },
  ];

  // ADD THIS NEW LINE RIGHT AFTER:
  const visibleTabs = tabs.filter((tab) => tab.alwaysShow || tab.permission);

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
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {student.first_name} {student.last_name}
              </h1>
              {/* {student.arabic_name && (
                <p
                  className="text-lg text-slate-600 dark:text-slate-400 mt-1"
                  dir="rtl"
                >
                  {student.arabic_name}
                </p>
              )} */}
              <div className="flex items-center gap-4 mt-3">
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

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as TabType);
                    // Clear dot for this tab when clicked
                    setTabUnread((prev) => ({ ...prev, [tab.id]: 0 }));
                  }}
                  className={`relative flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {(tabUnread[tab.id] || 0) > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
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
        {/* Add this right after the opening */}

        {visibleTabs.length < tabs.length && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-400">
                  Limited Access
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Some tabs are hidden based on your access permissions. Contact
                  an administrator if you need access to additional information.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* end */}

        {activeTab === "attendance" && (
          <AttendanceTab studentId={params.id as string} />
        )}

        {activeTab === "grades" && (
          <GradesTab studentId={params.id as string} />
        )}

        {activeTab === "memorization" && (
          <MemorizationTab studentId={params.id as string} />
        )}

        {activeTab === "finances" && (
          <FinancesTab studentId={params.id as string} />
        )}

        {activeTab === "certificates" && (
          <CertificatesTab studentId={params.id as string} />
        )}
        {activeTab === "feedback" && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-6">
            <FeedbackTab studentId={params.id as string} />
          </div>
        )}

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
