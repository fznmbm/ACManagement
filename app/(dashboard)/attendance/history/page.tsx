// app/(dashboard)/attendance/history/page.tsx
import { createClient } from "@/lib/supabase/server";
import AttendanceHistoryTable from "@/components/attendance/AttendanceHistoryTable";
import AttendanceFilters from "@/components/attendance/AttendanceFilters";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 50;

export default async function AttendanceHistoryPage({
  searchParams,
}: {
  searchParams: {
    class?: string;
    student?: string;
    from?: string;
    to?: string;
    status?: string;
    page?: string;
  };
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

  // Get classes
  let classesQuery = supabase
    .from("classes")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  if (profile?.role === "teacher") {
    classesQuery = classesQuery.eq("teacher_id", user.id);
  }

  const { data: classes } = await classesQuery;

  // Get students for filter
  const { data: students } = await supabase
    .from("students")
    .select("id, first_name, last_name, student_number")
    .eq("status", "active")
    .order("first_name");

  // Shared filter application so stats and the page of rows stay in sync.
  const applyFilters = (q: any) => {
    if (searchParams.class) q = q.eq("class_id", searchParams.class);
    if (searchParams.student) q = q.eq("student_id", searchParams.student);
    if (searchParams.from) q = q.gte("date", searchParams.from);
    if (searchParams.to) q = q.lte("date", searchParams.to);
    if (searchParams.status) q = q.eq("status", searchParams.status);
    return q;
  };

  // Stats over the WHOLE filtered set (one lightweight column), so the
  // headline numbers aren't capped by the page size.
  const { data: statusRows } = await applyFilters(
    supabase.from("attendance").select("status"),
  );

  const rows: Array<{ status: string }> = statusRows || [];
  const total = rows.length;
  const present = rows.filter((a) => a.status === "present").length;
  const absent = rows.filter((a) => a.status === "absent").length;
  const late = rows.filter((a) => a.status === "late").length;
  const excused = rows.filter((a) => a.status === "excused").length;
  const sick = rows.filter((a) => a.status === "sick").length;

  const stats = { total, present, absent, late, excused, sick };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(
    Math.max(1, parseInt(searchParams.page || "1", 10) || 1),
    totalPages,
  );
  const fromRow = (page - 1) * PAGE_SIZE;

  // Page of full records
  const { data: attendanceRecords } = await applyFilters(
    supabase
      .from("attendance")
      .select(
        `
      *,
      students (
        id,
        first_name,
        last_name,
        student_number
      ),
      classes (
        id,
        name
      )
    `,
      )
      .order("date", { ascending: false })
      .order("first_name", { referencedTable: "students", ascending: true })
      .order("created_at", { ascending: false }),
  ).range(fromRow, fromRow + PAGE_SIZE - 1);

  // Build a page link that preserves the active filters.
  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (searchParams.class) params.set("class", searchParams.class);
    if (searchParams.student) params.set("student", searchParams.student);
    if (searchParams.from) params.set("from", searchParams.from);
    if (searchParams.to) params.set("to", searchParams.to);
    if (searchParams.status) params.set("status", searchParams.status);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/attendance/history${qs ? `?${qs}` : ""}`;
  };

  const showingFrom = total === 0 ? 0 : fromRow + 1;
  const showingTo = Math.min(fromRow + PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance History</h2>
          <p className="text-muted-foreground">
            View and analyse attendance records
          </p>
        </div>
        <Link
          href="/attendance"
          className="btn-outline flex items-center space-x-2"
        >
          <ClipboardCheck className="h-4 w-4" />
          <span>Mark Attendance</span>
        </Link>
      </div>

      <AttendanceFilters classes={classes || []} students={students || []} />

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Records</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">Present</p>
          <p className="text-2xl font-bold text-green-700">
            {stats.present} (
            {total > 0 ? Math.round((present / total) * 100) : 0}%)
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Absent</p>
          <p className="text-2xl font-bold text-red-700">
            {stats.absent} ({total > 0 ? Math.round((absent / total) * 100) : 0}
            %)
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-700">Late</p>
          <p className="text-2xl font-bold text-orange-700">
            {stats.late} ({total > 0 ? Math.round((late / total) * 100) : 0}%)
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">Excused</p>
          <p className="text-2xl font-bold text-blue-700">
            {stats.excused} (
            {total > 0 ? Math.round((excused / total) * 100) : 0}%)
          </p>
        </div>
      </div>

      <AttendanceHistoryTable
        records={attendanceRecords || []}
        showingFrom={showingFrom}
        showingTo={showingTo}
        total={total}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            {page > 1 ? (
              <Link
                href={buildHref(page - 1)}
                scroll={false}
                className="btn-outline flex items-center gap-1 text-sm"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Link>
            ) : (
              <span className="btn-outline flex cursor-not-allowed items-center gap-1 text-sm opacity-50">
                <ChevronLeft className="h-4 w-4" />
                Previous
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={buildHref(page + 1)}
                scroll={false}
                className="btn-outline flex items-center gap-1 text-sm"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="btn-outline flex cursor-not-allowed items-center gap-1 text-sm opacity-50">
                Next
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
