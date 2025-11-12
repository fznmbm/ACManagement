// app/(dashboard)/curriculum-assessment/certificates/generate/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CertificateForm from "@/components/curriculum/CertificateForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function GenerateCertificatePage({
  searchParams,
}: {
  searchParams: { student?: string };
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

  // Only admins can generate certificates
  if (profile?.role !== "super_admin" && profile?.role !== "admin") {
    redirect("/curriculum-assessment/certificates");
  }

  // Get students
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name, student_number")
    .eq("status", "active")
    .order("last_name");

  // Get subjects
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center space-x-4">
        <Link
          href="/curriculum-assessment/certificates"
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold">Generate Certificate</h2>
          <p className="text-muted-foreground">
            Award a certificate to recognize student achievement
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <CertificateForm
          students={students || []}
          subjects={subjects || []}
          preSelectedStudent={searchParams.student}
        />
      </div>
    </div>
  );
}
