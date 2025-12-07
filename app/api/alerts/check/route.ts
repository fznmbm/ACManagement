import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { check_type } = body;

    let result;

    switch (check_type) {
      case "absences":
        // Check consecutive absences
        const { error: absenceError } = await supabase.rpc(
          "check_consecutive_absences"
        );
        if (absenceError) throw absenceError;
        result = { message: "Absence alerts checked successfully" };
        break;

      case "upcoming_fees":
        // Check fees due within 3 days
        const { error: upcomingError } = await supabase.rpc(
          "check_upcoming_fee_dues"
        );
        if (upcomingError) throw upcomingError;
        result = { message: "Upcoming fee alerts sent successfully" };
        break;

      case "overdue_fees":
        // Check overdue fees
        const { error: overdueError } = await supabase.rpc(
          "check_overdue_fees"
        );
        if (overdueError) throw overdueError;
        result = { message: "Overdue fee alerts sent successfully" };
        break;

      case "all":
        // Run all checks
        await supabase.rpc("check_consecutive_absences");
        await supabase.rpc("check_upcoming_fee_dues");
        await supabase.rpc("check_overdue_fees");
        result = { message: "All alert checks completed successfully" };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid check_type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error running alert checks:", error);
    return NextResponse.json(
      { error: "Failed to run alert checks" },
      { status: 500 }
    );
  }
}
