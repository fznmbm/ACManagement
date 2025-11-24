import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check user role (admin only)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get new status from request body
    const { status } = await request.json();

    // Validate status
    const validStatuses = [
      "pending",
      "under_review",
      "accepted",
      "rejected",
      "waitlist",
    ];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: "Invalid status. Must be one of: " + validStatuses.join(", "),
        },
        { status: 400 }
      );
    }

    // Get the application
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("status")
      .eq("id", params.id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Don't allow changing status of accepted applications
    if (application.status === "accepted" && status !== "accepted") {
      return NextResponse.json(
        { error: "Cannot change status of accepted applications" },
        { status: 400 }
      );
    }

    // Update application status
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (updateError) {
      console.error("Error updating status:", updateError);
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Status updated successfully",
        new_status: status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update status error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
