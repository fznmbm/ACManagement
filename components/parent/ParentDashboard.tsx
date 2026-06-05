"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Users,
  Calendar,
  TrendingUp,
  Book,
  DollarSign,
  ChevronRight,
} from "lucide-react";

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  status: string;
  class_id: string | null;
  classes?: {
    name: string;
  };
}

export default function ParentDashboard() {
  const supabase = createClient();

  const [students, setStudents] = useState<Student[]>([]);
  // applications removed - redirected to admin module
  const [loading, setLoading] = useState(true);
  const [parentEmail, setParentEmail] = useState("");
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.log("No user found");
          setLoading(false);
          return;
        }

        console.log("Fetching data for user:", user.id);

        // Get parent email
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", user.id)
          .single();

        if (profile) {
          setParentEmail(profile.email);
          console.log("Parent email:", profile.email);
        }

        // Get linked students - LIMITED TO 4 FOR DASHBOARD
        const { data: links, error: linksError } = await supabase
          .from("parent_student_links")
          .select(
            `
    student_id,
    relationship,
    is_primary,
    students!inner (
      id,
      student_number,
      first_name,
      last_name,
      status,
      class_id
    )
  `,
          )
          .eq("parent_user_id", user.id)
          .order("is_primary", { ascending: false })
          .limit(4);

        console.log("Students query result:", { links, linksError });

        if (linksError) {
          console.error("Error fetching students:", linksError);
        } else if (links && links.length > 0) {
          // Get student data
          const studentData = links
            .map((link: any) => link.students)
            .filter(Boolean);

          // Now fetch class names separately for each student
          const studentsWithClasses = await Promise.all(
            studentData.map(async (student: any) => {
              if (student.class_id) {
                const { data: classData } = await supabase
                  .from("classes")
                  .select("name")
                  .eq("id", student.class_id)
                  .single();

                return {
                  ...student,
                  classes: classData,
                };
              }
              return student;
            }),
          );

          setStudents(studentsWithClasses);
          // Get total count for "View All" button
          // Get total count for "View All" button
          const { count: totalCount } = await supabase
            .from("parent_student_links")
            .select("*", { count: "exact", head: true })
            .eq("parent_user_id", user.id);

          setTotalStudents(totalCount || 0);
          console.log("Total students:", totalCount);

          // Get active students count
          const { count: activeCount } = await supabase
            .from("parent_student_links")
            .select("student_id, students!inner(status)", {
              count: "exact",
              head: true,
            })
            .eq("parent_user_id", user.id)
            .eq("students.status", "active");

          setActiveStudents(activeCount || 0);
          console.log("Active students:", activeCount);
        } else {
          console.log("No student links found");
          setStudents([]);
        }

        // applications fetch removed
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "graduated":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  // getApplicationStatusColor removed

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-green-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          Welcome to Your Portal
        </h1>
        <p className="text-green-50">
          Track your children's progress and stay connected with the school.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* My Children - Clickable */}
        <Link href="/parent/children">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  My Children
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {totalStudents}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>
        </Link>

        {/* Finances - Clickable */}
        <Link href="/parent/finances">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Finances
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  View Invoices
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </Link>
{/* removed redundant stat cards */}

      {/* My Children Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              My Children
            </h2>
            <Link
              href="/parent/children"
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">
              No students linked to your account yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {students.map((student) => (
              <Link
                key={student.id}
                href={`/parent/student/${student.id}`}
                className="block p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {student.first_name[0]}
                          {student.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {student.first_name} {student.last_name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {student.student_number} •{" "}
                          {student.classes?.name || "No class assigned"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        student.status,
                      )}`}
                    >
                      {student.status.charAt(0).toUpperCase() +
                        student.status.slice(1)}
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </div>

                {/* quick links removed - use tabs on student detail page */}
              </Link>
            ))}
          </div>
        )}

        {/* View All Button - Only show if more than 4 children */}
        {totalStudents > 4 && (
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
            <Link
              href="/parent/children"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <span>View All {totalStudents} Children</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Applications section removed - parents contact admin directly */}
    </div>
  );
}
