// app/(dashboard)/students/page.tsx
import { createClient } from "@/lib/supabase/server";
import StudentsTable from "@/components/students/StudentsTable";
import StudentsHeader from "@/components/students/StudentsHeader";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { search?: string; class?: string; status?: string };
}) {
  const supabase = await createClient();

  // Build query
  let query = supabase
    .from("students")
    .select(
      `
      *,
      classes (
        id,
        name
      )
    `
    )
    .order("created_at", { ascending: false });

  // Apply filters
  if (searchParams.search) {
    query = query.or(
      `first_name.ilike.%${searchParams.search}%,last_name.ilike.%${searchParams.search}%,student_number.ilike.%${searchParams.search}%`
    );
  }

  if (searchParams.class) {
    query = query.eq("class_id", searchParams.class);
  }

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  const { data: students, error } = await query;

  // Get all classes for filter dropdown
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching students:", error);
  }

  return (
    <div className="space-y-6">
      <StudentsHeader classes={classes || []} />
      <StudentsTable students={students || []} />
    </div>
  );
}
