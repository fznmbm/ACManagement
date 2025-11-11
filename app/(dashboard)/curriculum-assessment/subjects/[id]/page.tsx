// app/(dashboard)/curriculum-assessment/subjects/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit, BookOpen, Calendar, Clock, Plus } from "lucide-react";
import CurriculumTopics from "@/components/curriculum/CurriculumTopics";

export default async function SubjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
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

  // Get subject details
  const { data: subject, error } = await supabase
    .from("subjects")
    .select(
      `
      *,
      classes (
        id,
        name
      )
    `
    )
    .eq("id", params.id)
    .single();

  if (error || !subject) {
    notFound();
  }

  // Get topics for this subject
  const { data: topics } = await supabase
    .from("curriculum_topics")
    .select("*")
    .eq("subject_id", params.id)
    .order("sequence_order");

  // Get assessment count
  const { count: assessmentCount } = await supabase
    .from("academic_progress")
    .select("*", { count: "exact", head: true })
    .eq("subject_id", params.id);

  const canManage = ["super_admin", "admin"].includes(profile?.role || "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/curriculum-assessment/subjects"
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold">{subject.name}</h2>
            <p className="text-muted-foreground">
              {subject.classes ? subject.classes.name : "All classes"} •{" "}
              {subject.academic_year || "No year set"}
            </p>
          </div>
        </div>
        {canManage && (
          <Link
            href={`/curriculum-assessment/subjects/${subject.id}/edit`}
            className="btn-primary flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Subject</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Subject Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Subject Information</h3>
            <div className="space-y-4">
              {subject.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="mt-1">{subject.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Academic Year</p>
                  <p className="font-medium">
                    {subject.academic_year || "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {subject.duration_weeks
                      ? `${subject.duration_weeks} weeks`
                      : "Not set"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      subject.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {subject.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {subject.classes && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Assigned Class
                  </p>
                  <Link
                    href={`/classes/${subject.classes.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {subject.classes.name}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Curriculum Topics */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Curriculum Topics ({topics?.length || 0})
              </h3>
              {canManage && (
                <button className="btn-outline flex items-center space-x-2 text-sm">
                  <Plus className="h-4 w-4" />
                  <span>Add Topic</span>
                </button>
              )}
            </div>

            <CurriculumTopics
              topics={topics || []}
              subjectId={subject.id}
              canManage={canManage}
            />
          </div>
        </div>

        {/* Right Column - Statistics */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-3xl font-bold">{topics?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Topics</p>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-700">
                  {assessmentCount || 0}
                </p>
                <p className="text-sm text-blue-600">Assessments</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/curriculum-assessment/assessments/new?subject=${subject.id}`}
                className="btn-primary w-full"
              >
                Record Assessment
              </Link>
              <Link
                href={`/curriculum-assessment/assessments?subject=${subject.id}`}
                className="btn-outline w-full"
              >
                View Assessments
              </Link>
              {canManage && (
                <Link
                  href={`/curriculum-assessment/subjects/${subject.id}/edit`}
                  className="btn-outline w-full"
                >
                  Edit Subject
                </Link>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tip</h4>
            <p className="text-sm text-blue-800">
              Break your subject into logical topics and arrange them in
              teaching sequence for better organization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
