// app/(dashboard)/classes/page.tsx
import { createClient } from "@/lib/supabase/server";
import ClassesTable from "@/components/classes/ClassesTable";
import ClassesHeader from "@/components/classes/ClassesHeader";
import { redirect } from "next/navigation";

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string };
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
    .from("classes")
    .select(
      `
      *,
      profiles:teacher_id (
        id,
        full_name,
        email
      )
    `
    )
    .order("name");

  // If teacher (not admin), only show their classes
  if (profile?.role === "teacher") {
    query = query.eq("teacher_id", user.id);
  }

  // Apply filters
  if (searchParams.search) {
    query = query.ilike("name", `%${searchParams.search}%`);
  }

  if (searchParams.status === "active") {
    query = query.eq("is_active", true);
  } else if (searchParams.status === "inactive") {
    query = query.eq("is_active", false);
  }

  const { data: classes, error } = await query;

  if (error) {
    console.error("Error fetching classes:", error);
  }

  // Student counts — one query, tallied in memory (was one query per class).
  const { data: activeStudents } = await supabase
    .from("students")
    .select("class_id")
    .eq("status", "active");

  const counts = new Map<string, number>();
  (activeStudents || []).forEach((s) => {
    if (s.class_id) counts.set(s.class_id, (counts.get(s.class_id) || 0) + 1);
  });

  const classesWithCounts = (classes || []).map((classItem) => ({
    ...classItem,
    student_count: counts.get(classItem.id) || 0,
  }));

  return (
    <div className="space-y-6">
      <ClassesHeader />
      <ClassesTable
        classes={classesWithCounts}
        userRole={profile?.role || "teacher"}
      />
    </div>
  );
}
