import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendApplicationRejectedEmail } from "@/lib/email/send-application-email";

export async function POST(
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

    // Get rejection reason from request body
    const { reason } = await request.json();

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

    // Get the application
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("*")
      .eq("id", params.id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if already rejected
    if (application.status === "rejected") {
      return NextResponse.json(
        { error: "Application already rejected" },
        { status: 400 }
      );
    }

    // Check if already accepted (can't reject accepted applications)
    if (application.status === "accepted") {
      return NextResponse.json(
        { error: "Cannot reject an accepted application" },
        { status: 400 }
      );
    }

    // Update application status to rejected
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status: "rejected",
        rejection_reason: reason.trim(),
        reviewed_by: user.id,
        review_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (updateError) {
      console.error("Error rejecting application:", updateError);
      return NextResponse.json(
        { error: "Failed to reject application" },
        { status: 500 }
      );
    }

    // Send rejection email - NEW EMAIL INTEGRATION
    try {
      console.log("📧 Sending rejection email to:", application.parent_email);
      const emailResult = await sendApplicationRejectedEmail(
        application,
        reason.trim()
      );

      if (emailResult.success) {
        console.log("✅ Rejection email sent successfully");
      } else {
        console.error("⚠️ Email failed but application was rejected");
      }
    } catch (emailError) {
      console.error("Email error:", emailError);
      // Don't fail the operation if email fails
      // Application is already rejected, email is secondary
    }

    // TODO: Send rejection email to parent
    console.log("=== APPLICATION REJECTED ===");
    console.log(`Application: ${application.application_number}`);
    console.log(`Reason: ${reason}`);
    console.log(`Parent Email: ${application.parent_email}`);
    console.log("===========================");

    return NextResponse.json(
      {
        success: true,
        message: "Application rejected successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reject application error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
