// app/(dashboard)/curriculum-assessment/certificates/view/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import CertificateViewClient from "@/components/curriculum/CertificateViewClient";

export default async function CertificateViewPage({
  searchParams,
}: {
  searchParams: { id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!searchParams.id) {
    redirect("/curriculum-assessment/certificates");
  }

  // Get certificate details
  const { data: certificate, error } = await supabase
    .from("certificates")
    .select(
      `
      *,
      students (
        id,
        first_name,
        last_name,
        student_number,
        arabic_name
      ),
      subjects (
        id,
        name
      ),
      profiles!certificates_issued_by_fkey (
        full_name
      )
    `
    )
    .eq("id", searchParams.id)
    .single();

  if (error || !certificate) {
    notFound();
  }

  // Get centre info settings
  const { data: centreSettings, error: settingsError } = await supabase
    .from("system_settings")
    .select("setting_value")
    .eq("setting_key", "centre_info")
    .maybeSingle();

  let schoolInfo = centreSettings?.setting_value || {};
  // Parse if it's a string
  if (typeof schoolInfo === "string") {
    try {
      schoolInfo = JSON.parse(schoolInfo);
    } catch (e) {
      console.error("Failed to parse settings:", e);
      schoolInfo = {};
    }
  }

  return (
    <CertificateViewClient certificate={certificate} schoolInfo={schoolInfo} />
  );
}
