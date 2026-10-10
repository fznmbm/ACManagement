// app/(dashboard)/curriculum-assessment/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  Award,
  Brain,
  Plus,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";

export default async function LearningPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const [
    { count: totalSubjects },
    { count: totalExams },
    { count: totalResults },
    { count: totalCertificates },
  ] = await Promise.all([
    supabase
      .from("subjects")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase.from("exams").select("*", { count: "exact", head: true }),
    supabase.from("academic_progress").select("*", { count: "exact", head: true }),
    supabase.from("certificates").select("*", { count: "exact", head: true }),
  ]);

  // Recent exams (newest first).
  const { data: recentExams } = await supabase
    .from("exams")
    .select(`id, title, exam_date, subjects ( name ), classes ( name )`)
    .order("exam_date", { ascending: false })
    .limit(5);

  const canManage = ["super_admin", "admin"].includes(profile?.role || "");

  const statCard = (
    href: string,
    label: string,
    value: number,
    Icon: any,
    accent: string,
  ) => (
    <Link
      href={href}
      className={`bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all hover:border-primary`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold mt-1">{value || 0}</p>
        </div>
        <Icon className={`h-8 w-8 ${accent}`} />
      </div>
    </Link>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Learning</h2>
          <p className="text-muted-foreground">
            Subjects, exams and results for every class.
          </p>
        </div>
        <Link
          href="/curriculum-assessment/exams/new"
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Record exam</span>
          <span className="sm:hidden">Exam</span>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCard(
          "/curriculum-assessment/subjects",
          "Active subjects",
          totalSubjects || 0,
          BookOpen,
          "text-primary",
        )}
        {statCard(
          "/curriculum-assessment/exams",
          "Exams",
          totalExams || 0,
          ClipboardList,
          "text-blue-600",
        )}
        {statCard(
          "/curriculum-assessment/exams",
          "Results recorded",
          totalResults || 0,
          ClipboardList,
          "text-green-600",
        )}
        {statCard(
          "/curriculum-assessment/certificates",
          "Certificates",
          totalCertificates || 0,
          Award,
          "text-yellow-600",
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Quick actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/curriculum-assessment/exams/new"
            className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Record exam results</p>
              <p className="text-sm text-muted-foreground">
                Mark a whole class on one screen
              </p>
            </div>
          </Link>

          {canManage && (
            <Link
              href="/curriculum-assessment/subjects/new"
              className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Add subject</p>
                <p className="text-sm text-muted-foreground">
                  Create a new subject
                </p>
              </div>
            </Link>
          )}

          {canManage && (
            <Link
              href="/curriculum-assessment/certificates/generate"
              className="flex items-center gap-3 p-4 border border-border rounded-lg hover:border-primary hover:bg-accent transition-colors"
            >
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium">Award certificate</p>
                <p className="text-sm text-muted-foreground">
                  Issue a student certificate
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Recent exams */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent exams</h3>
          <Link
            href="/curriculum-assessment/exams"
            className="text-sm text-primary hover:underline"
          >
            View all →
          </Link>
        </div>

        {recentExams && recentExams.length > 0 ? (
          <div className="space-y-2">
            {recentExams.map((e) => (
              <Link
                key={e.id}
                href={`/curriculum-assessment/exams/${e.id}`}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{e.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {(e as any).subjects?.name || "—"} •{" "}
                    {(e as any).classes?.name || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm text-muted-foreground">
                    {formatDate(e.exam_date, "short")}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No exams recorded yet</p>
            <Link
              href="/curriculum-assessment/exams/new"
              className="text-primary hover:underline text-sm mt-2 inline-block"
            >
              Record your first exam →
            </Link>
          </div>
        )}
      </div>

      {/* Module navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/curriculum-assessment/subjects"
          className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Subjects</h4>
              <p className="text-sm text-muted-foreground">
                The subjects taught across classes
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/curriculum-assessment/exams"
          className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ClipboardList className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Exams &amp; results</h4>
              <p className="text-sm text-muted-foreground">
                Create exams and mark the whole class
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Memorization — being retired; kept linked so nothing dead-ends */}
      <Link
        href="/curriculum-assessment/memorization"
        className="flex items-center justify-between bg-muted/40 border border-border rounded-lg px-5 py-3 hover:bg-muted/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Brain className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Memorisation tracking</p>
            <p className="text-xs text-muted-foreground">
              Being folded into results — still here for now
            </p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
    </div>
  );
}
