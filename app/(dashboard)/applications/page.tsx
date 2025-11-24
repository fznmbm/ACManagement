import { createClient } from "@/lib/supabase/server";
import ApplicationsHeader from "@/components/applications/ApplicationsHeader";
import ApplicationsTable from "@/components/applications/ApplicationsTable";
import AcademicYearSelector from "@/components/applications/AcademicYearSelector";
import { FileText, Clock, CheckCircle, XCircle } from "lucide-react";

// Force dynamic rendering - no caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: {
    status?: string;
    search?: string;
    year?: string;
  };
}) {
  const supabase = await createClient();

  // Get current active academic year from settings
  const { data: activeSetting } = await supabase
    .from("application_settings")
    .select("academic_year")
    .eq("is_active", true)
    .single();

  const currentYear = activeSetting?.academic_year || "2025-2026";

  // Use selected year from URL, or default to current year
  const selectedYear = searchParams.year || currentYear;

  // Get all unique academic years (for dropdown)
  const { data: allYears } = await supabase
    .from("applications")
    .select("academic_year")
    .order("academic_year", { ascending: false });

  const uniqueYears = [...new Set(allYears?.map((a) => a.academic_year) || [])];

  // Get application statistics for selected year
  const { data: stats } = await supabase
    .from("applications")
    .select("status")
    .eq("academic_year", selectedYear);

  const pendingCount = stats?.filter((s) => s.status === "pending").length || 0;
  const acceptedCount =
    stats?.filter((s) => s.status === "accepted").length || 0;
  const rejectedCount =
    stats?.filter((s) => s.status === "rejected").length || 0;
  const totalCount = stats?.length || 0;

  // Build query for applications (filtered by year)
  let query = supabase
    .from("applications")
    .select("*")
    .eq("academic_year", selectedYear)
    .order("submission_date", { ascending: false });

  // Filter by status if provided
  if (searchParams.status && searchParams.status !== "all") {
    query = query.eq("status", searchParams.status);
  }

  // Search if provided
  if (searchParams.search) {
    const searchTerm = `%${searchParams.search}%`;
    query = query.or(
      `child_first_name.ilike.${searchTerm},child_last_name.ilike.${searchTerm},parent_email.ilike.${searchTerm},application_number.ilike.${searchTerm}`
    );
  }

  const { data: applications, error } = await query;

  if (error) {
    console.error("Error fetching applications:", error);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-muted-foreground">
            Review and manage student applications
          </p>
        </div>

        {/* Academic Year Selector */}
        <AcademicYearSelector
          years={uniqueYears}
          selectedYear={selectedYear}
          currentYear={currentYear}
        />
      </div>

      {/* Year Info Banner */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              Viewing Applications for:{" "}
              <span className="text-primary font-bold">{selectedYear}</span>
            </p>
            {selectedYear !== currentYear && (
              <p className="text-xs text-muted-foreground mt-1">
                This is an archived academic year. Current year is {currentYear}
                .
              </p>
            )}
          </div>
          {selectedYear === currentYear && (
            <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
              Current Year
            </span>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Applications
              </p>
              <p className="text-3xl font-bold">{totalCount}</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-3xl font-bold text-orange-600">
                {pendingCount}
              </p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Accepted</p>
              <p className="text-3xl font-bold text-green-600">
                {acceptedCount}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <ApplicationsHeader />

      {/* Applications Table */}
      <ApplicationsTable applications={applications || []} />
    </div>
  );
}
