"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  Book,
  DollarSign,
  ChevronRight,
  Award,
} from "lucide-react";

interface Student {
  id: string;
  student_number: string;
  first_name: string;
  last_name: string;
  status: string;
  class_id: string | null;
  classes?: {
    class_name: string;
  };
}

export default function ParentDashboard() {
  const supabase = createClient();

  const [students, setStudents] = useState<Student[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [parentEmail, setParentEmail] = useState("");

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

        // Get linked students - FIXED QUERY
        const { data: links, error: linksError } = await supabase
          .from("parent_student_links")
          .select(
            `
            student_id,
            students!inner (
              id,
              student_number,
              first_name,
              last_name,
              status,
              class_id
            )
          `
          )
          .eq("parent_user_id", user.id);

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
            })
          );

          setStudents(studentsWithClasses);
          console.log(
            "Students loaded:",
            studentsWithClasses.length,
            studentsWithClasses
          );
        } else {
          console.log("No student links found");
          setStudents([]);
        }

        // Get applications
        if (profile?.email) {
          const { data: apps, error: appsError } = await supabase
            .from("applications")
            .select("*")
            .eq("parent_email", profile.email)
            .order("created_at", { ascending: false });

          console.log("Applications query result:", { apps, appsError });

          if (appsError) {
            console.error("Error fetching applications:", appsError);
          } else if (apps) {
            setApplications(apps);
            console.log("Applications loaded:", apps.length);
          }
        }
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

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "waitlist":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

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
        <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                My Children
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {students.length}
              </p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Applications
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {applications.length}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Active Students
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {students.filter((s) => s.status === "active").length}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Pending Apps
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {applications.filter((a) => a.status === "pending").length}
              </p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* My Children Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              My Children
            </h2>
            <Link
              href="/parent/students"
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              View All
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
                          {student.classes?.class_name || "No class assigned"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        student.status
                      )}`}
                    >
                      {student.status.charAt(0).toUpperCase() +
                        student.status.slice(1)}
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  </div>
                </div>

                {/* Quick Info Cards */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center text-slate-600 dark:text-slate-400 text-xs mb-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      Attendance
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      View →
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center text-slate-600 dark:text-slate-400 text-xs mb-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Grades
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      View →
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center text-slate-600 dark:text-slate-400 text-xs mb-1">
                      <Book className="h-3 w-3 mr-1" />
                      Memorization
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      View →
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <div className="flex items-center text-slate-600 dark:text-slate-400 text-xs mb-1">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Fees
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      View →
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Applications */}
      {applications.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Recent Applications
              </h2>
              <Link
                href="/parent/applications"
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                View All
              </Link>
            </div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {applications.slice(0, 3).map((app) => (
              <div key={app.id} className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {app.student_first_name} {app.student_last_name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Submitted {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getApplicationStatusColor(
                      app.status
                    )}`}
                  >
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>

                {app.status === "accepted" && app.acceptance_date && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mt-3">
                    <div className="flex items-center text-green-800 dark:text-green-400 text-sm">
                      <Award className="h-4 w-4 mr-2" />
                      Accepted on{" "}
                      {new Date(app.acceptance_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
