// app/(dashboard)/curriculum-assessment/certificates/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CertificatesList from "@/components/curriculum/CertificatesList";
import Link from "next/link";
import { Plus, Award } from "lucide-react";

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: { student?: string; type?: string };
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

  // Build query
  let query = supabase
    .from("certificates")
    .select(
      `
      *,
      students (
        id,
        first_name,
        last_name,
        student_number
      ),
      subjects (
        id,
        name
      )
    `
    )
    .order("issue_date", { ascending: false });

  // Apply filters
  if (searchParams.student) {
    query = query.eq("student_id", searchParams.student);
  }

  if (searchParams.type) {
    query = query.eq("certificate_type", searchParams.type);
  }

  const { data: certificates, error } = await query;

  if (error) {
    console.error("Error fetching certificates:", error);
  }

  // Get students for filter
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name, student_number")
    .eq("status", "active")
    .order("last_name");

  // Get statistics
  const { count: totalCertificates } = await supabase
    .from("certificates")
    .select("*", { count: "exact", head: true });

  const canManage = ["super_admin", "admin"].includes(profile?.role || "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Certificates</h2>
          <p className="text-muted-foreground">
            Manage and issue student certificates
          </p>
        </div>
        {canManage && (
          <Link
            href="/curriculum-assessment/certificates/generate"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Generate Certificate</span>
          </Link>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Issued</p>
              <p className="text-3xl font-bold mt-1">
                {totalCertificates || 0}
              </p>
            </div>
            <Award className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div>
            <p className="text-sm text-muted-foreground">Subject Completion</p>
            <p className="text-3xl font-bold mt-1 text-blue-600">
              {certificates?.filter(
                (c) => c.certificate_type === "subject_completion"
              ).length || 0}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div>
            <p className="text-sm text-muted-foreground">Memorization</p>
            <p className="text-3xl font-bold mt-1 text-green-600">
              {certificates?.filter(
                (c) => c.certificate_type === "memorization_completion"
              ).length || 0}
            </p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div>
            <p className="text-sm text-muted-foreground">Excellence</p>
            <p className="text-3xl font-bold mt-1 text-purple-600">
              {certificates?.filter(
                (c) => c.certificate_type === "academic_excellence"
              ).length || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <form method="GET" className="flex gap-4">
          <select
            name="student"
            defaultValue={searchParams.student}
            className="form-input"
          >
            <option value="">All Students</option>
            {students?.map((student) => (
              <option key={student.id} value={student.id}>
                {student.first_name} {student.last_name} (#
                {student.student_number})
              </option>
            ))}
          </select>

          <select
            name="type"
            defaultValue={searchParams.type}
            className="form-input"
          >
            <option value="">All Types</option>
            <option value="subject_completion">Subject Completion</option>
            <option value="memorization_completion">
              Memorization Completion
            </option>
            <option value="academic_excellence">Academic Excellence</option>
            <option value="year_completion">Year Completion</option>
          </select>

          <button type="submit" className="btn-primary">
            Filter
          </button>

          {(searchParams.student || searchParams.type) && (
            <Link
              href="/curriculum-assessment/certificates"
              className="btn-outline"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Certificates List */}
      <CertificatesList
        certificates={certificates || []}
        canManage={canManage}
      />
    </div>
  );
}
