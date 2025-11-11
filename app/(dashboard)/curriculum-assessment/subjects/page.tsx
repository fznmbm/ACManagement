// app/(dashboard)/curriculum-assessment/subjects/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SubjectsTable from "@/components/curriculum/SubjectsTable";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: { search?: string; class?: string; status?: string };
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
    .order("name");

  // Apply filters
  if (searchParams.search) {
    query = query.ilike("name", `%${searchParams.search}%`);
  }

  if (searchParams.class) {
    query = query.eq("class_id", searchParams.class);
  }

  if (searchParams.status === "active") {
    query = query.eq("is_active", true);
  } else if (searchParams.status === "inactive") {
    query = query.eq("is_active", false);
  }

  const { data: subjects, error } = await query;

  if (error) {
    console.error("Error fetching subjects:", error);
  }

  // Get all classes for filter dropdown
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  // Get topic counts for each subject
  const subjectsWithCounts = await Promise.all(
    (subjects || []).map(async (subject) => {
      const { count } = await supabase
        .from("curriculum_topics")
        .select("*", { count: "exact", head: true })
        .eq("subject_id", subject.id);

      return {
        ...subject,
        topic_count: count || 0,
      };
    })
  );

  const canManage = ["super_admin", "admin"].includes(profile?.role || "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subjects</h2>
          <p className="text-muted-foreground">
            Manage curriculum subjects and topics
          </p>
        </div>
        {canManage && (
          <Link
            href="/curriculum-assessment/subjects/new"
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Subject</span>
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-card border border-border rounded-lg p-4">
        <form method="GET" className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              name="search"
              placeholder="Search subjects..."
              defaultValue={searchParams.search}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            name="class"
            defaultValue={searchParams.class}
            className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Classes</option>
            {classes?.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>

          <select
            name="status"
            defaultValue={searchParams.status}
            className="px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button type="submit" className="btn-primary">
            Search
          </button>

          {(searchParams.search ||
            searchParams.class ||
            searchParams.status) && (
            <Link
              href="/curriculum-assessment/subjects"
              className="btn-outline"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Subjects Table */}
      <SubjectsTable subjects={subjectsWithCounts} canManage={canManage} />
    </div>
  );
}
