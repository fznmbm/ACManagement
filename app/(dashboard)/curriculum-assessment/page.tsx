// app/(dashboard)/curriculum-assessment/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, ClipboardList, Brain, Award, Plus } from "lucide-react";

export default async function CurriculumAssessmentPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get statistics
  const [
    { count: totalSubjects },
    { count: totalAssessments },
    { count: totalMemorizationItems },
    { count: totalCertificates },
  ] = await Promise.all([
    supabase
      .from("subjects")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("academic_progress")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("memorization_items")
      .select("*", { count: "exact", head: true }),
    supabase.from("certificates").select("*", { count: "exact", head: true }),
  ]);

  // Get recent assessments
  const { data: recentAssessments } = await supabase
    .from("academic_progress")
    .select(
      `
      *,
      students (first_name, last_name, student_number),
      subjects (name)
    `
    )
    .order("assessment_date", { ascending: false })
    .limit(5);

  const canManage = ["super_admin", "admin"].includes(profile?.role || "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Curriculum & Assessment</h2>
        <p className="text-muted-foreground">
          Manage subjects, track assessments, and monitor student progress
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Subjects</p>
              <p className="text-3xl font-bold mt-1">{totalSubjects || 0}</p>
            </div>
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Assessments</p>
              <p className="text-3xl font-bold mt-1">{totalAssessments || 0}</p>
            </div>
            <ClipboardList className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Memorization Items
              </p>
              <p className="text-3xl font-bold mt-1">
                {totalMemorizationItems || 0}
              </p>
            </div>
            <Brain className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Certificates Issued
              </p>
              <p className="text-3xl font-bold mt-1">
                {totalCertificates || 0}
              </p>
            </div>
            <Award className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {canManage && (
            <Link
              href="/curriculum-assessment/subjects/new"
              className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Add Subject</p>
                <p className="text-sm text-muted-foreground">
                  Create new subject
                </p>
              </div>
            </Link>
          )}

          <Link
            href="/curriculum-assessment/assessments/new"
            className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="p-2 bg-blue-100 rounded-lg">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Record Assessment</p>
              <p className="text-sm text-muted-foreground">
                Add test/quiz results
              </p>
            </div>
          </Link>

          <Link
            href="/curriculum-assessment/memorization/track"
            className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="p-2 bg-purple-100 rounded-lg">
              <Brain className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">Track Memorization</p>
              <p className="text-sm text-muted-foreground">
                Update student progress
              </p>
            </div>
          </Link>

          {canManage && (
            <Link
              href="/curriculum-assessment/certificates/generate"
              className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Award className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium">Generate Certificate</p>
                <p className="text-sm text-muted-foreground">
                  Award student certificate
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Recent Assessments */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Recent Assessments</h3>
          <Link
            href="/curriculum-assessment/assessments"
            className="text-sm text-primary hover:underline"
          >
            View all →
          </Link>
        </div>

        {recentAssessments && recentAssessments.length > 0 ? (
          <div className="space-y-3">
            {recentAssessments.map((assessment) => (
              <div
                key={assessment.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">
                    {assessment.students?.first_name}{" "}
                    {assessment.students?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {assessment.subjects?.name} • {assessment.assessment_type}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">{assessment.percentage}%</p>
                    <p className="text-sm text-muted-foreground">
                      {assessment.grade}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {assessment.assessment_date
                      ? new Date(
                          assessment.assessment_date
                        ).toLocaleDateString()
                      : "N/A"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No assessments recorded yet</p>
            <Link
              href="/curriculum-assessment/assessments/new"
              className="text-primary hover:underline text-sm mt-2 inline-block"
            >
              Record your first assessment →
            </Link>
          </div>
        )}
      </div>

      {/* Module Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/curriculum-assessment/subjects"
          className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all"
        >
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Subjects & Curriculum</h4>
              <p className="text-sm text-muted-foreground">
                Manage subjects, topics, and learning objectives
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/curriculum-assessment/memorization"
          className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-all"
        >
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Memorization Library</h4>
              <p className="text-sm text-muted-foreground">
                Duas, Surahs, and Hadiths tracking
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
