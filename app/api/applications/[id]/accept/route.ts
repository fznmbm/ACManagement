import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendApplicationAcceptedEmail } from "@/lib/email/send-application-email";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 🔍 DIAGNOSTIC: Check if service key exists
  console.log(
    "🔑 Service Role Key exists:",
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  console.log(
    "🔑 Service Role Key length:",
    process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
  );

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

    // Check if already accepted
    if (application.status === "accepted") {
      return NextResponse.json(
        { error: "Application already accepted" },
        { status: 400 }
      );
    }

    // Check if student already exists for this application
    const { data: existingStudent } = await supabase
      .from("students")
      .select("id, student_number")
      .eq("application_id", application.id)
      .single();

    if (existingStudent) {
      return NextResponse.json(
        {
          error: "Student already created for this application",
          student_number: existingStudent.student_number,
        },
        { status: 400 }
      );
    }

    // Generate student number
    // Format: Current year (25) + 6 digit sequence
    const currentYear = new Date().getFullYear().toString().slice(-2);

    // Get the highest student number for this year
    const { data: latestStudent } = await supabase
      .from("students")
      .select("student_number")
      .like("student_number", `${currentYear}%`)
      .order("student_number", { ascending: false })
      .limit(1)
      .single();

    let sequence = 1;
    if (latestStudent?.student_number) {
      const lastSequence = parseInt(latestStudent.student_number.slice(2));
      sequence = lastSequence + 1;
    }

    const studentNumber = `${currentYear}${String(sequence).padStart(6, "0")}`;

    // Create student record
    const { data: newStudent, error: studentError } = await supabase
      .from("students")
      .insert({
        student_number: studentNumber,
        first_name: application.child_first_name,
        last_name: application.child_last_name,
        date_of_birth: application.date_of_birth,
        gender: application.gender,
        parent_name: application.parent_name,
        parent_email: application.parent_email || null,
        parent_phone: application.parent_phone,
        parent_phone_secondary: application.parent_phone_alternate || null,
        address: application.address || null,
        city: application.city || null,
        postal_code: application.postal_code || null,
        medical_notes: application.medical_conditions || null,
        notes: application.special_requirements || null,
        status: "active",
        enrollment_date: new Date().toISOString().split("T")[0],
        application_id: application.id,
      })
      .select()
      .single();

    if (studentError) {
      console.error("Error creating student:", studentError);
      console.error("Student data:", {
        student_number: studentNumber,
        first_name: application.child_first_name,
        last_name: application.child_last_name,
      });
      return NextResponse.json(
        {
          error: "Failed to create student record",
          details: studentError.message, // Add error details for debugging
        },
        { status: 500 }
      );
    }

    // Update application status
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        status: "accepted",
        reviewed_by: user.id,
        review_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        converted_to_student_id: newStudent.id, // ← ADD THIS LINE
        converted_at: new Date().toISOString(), // ← ADD THIS LINE
        converted_by: user.id, // ← ADD THIS LINE
      })
      .eq("id", application.id);

    if (updateError) {
      console.error("Error updating application status:", updateError);
      // Student is created, so we don't want to rollback
      // Just log the error
    }

    // Create student consent record for photo/video
    const { error: consentError } = await supabase
      .from("student_consents")
      .insert({
        student_id: newStudent.id,
        photo_consent: application.photo_consent !== "none",
        consent_date:
          application.photo_consent_granted_date ||
          new Date().toISOString().split("T")[0],
      });

    if (consentError) {
      console.error("Error creating consent record:", consentError);
      // Don't fail the whole operation if consent fails
    }

    // ============================================
    // CREATE PARENT PROFILE & LINK
    // ============================================
    let parentUserId = null;

    // Create service role client for admin operations
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if parent profile already exists
    const { data: existingParent } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", application.parent_email)
      .single();

    parentUserId = existingParent?.id;

    if (!existingParent && application.parent_email) {
      // Check if auth user already exists (for parents with multiple children)
      const { data: existingAuthUsers } =
        await supabaseAdmin.auth.admin.listUsers();
      const existingAuthUser = existingAuthUsers.users.find(
        (u) => u.email === application.parent_email
      );

      if (existingAuthUser) {
        // Auth user exists - use existing parent
        parentUserId = existingAuthUser.id;
        console.log("✅ Parent already exists, linking to new child");
      } else {
        // Create NEW auth user (first child)
        const { data: authUser, error: authError } =
          await supabaseAdmin.auth.admin.createUser({
            email: application.parent_email,
            email_confirm: true,
            user_metadata: {
              full_name: application.parent_name,
              role: "parent",
            },
          });

        if (authError) {
          console.error("❌ Error creating parent auth user:", authError);
          return NextResponse.json(
            {
              error: "Failed to create parent account",
              details: authError.message,
            },
            { status: 500 }
          );
        }

        parentUserId = authUser.user.id;
        console.log("✅ New parent auth user created");

        // Wait for trigger to create profile
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Create parent-student link
    if (parentUserId) {
      const { error: linkError } = await supabase
        .from("parent_student_links")
        .insert({
          parent_user_id: parentUserId,
          student_id: newStudent.id,
          relationship: "parent",
          is_primary: true,
          can_view_attendance: true,
          can_view_grades: true,
          can_view_financial: true,
          can_receive_notifications: true,
        });

      if (linkError) {
        console.error("Error creating parent-student link:", linkError);
      } else {
        console.log("✅ Parent-student link created");
      }
    }

    // Send acceptance email - NEW EMAIL INTEGRATION
    try {
      console.log("📧 Sending acceptance email to:", application.parent_email);
      const emailResult = await sendApplicationAcceptedEmail(
        application,
        studentNumber
      );

      if (emailResult.success) {
        console.log("✅ Acceptance email sent successfully");
      } else {
        console.error("⚠️ Email failed but student was created");
      }
    } catch (emailError) {
      console.error("Email error:", emailError);
      // Don't fail the operation if email fails
      // Student is already created, email is secondary
    }

    // TODO: Send acceptance email to parent
    console.log("=== APPLICATION ACCEPTED ===");
    console.log(`Application: ${application.application_number}`);
    console.log(`Student Created: ${studentNumber}`);
    console.log(`Parent Email: ${application.parent_email}`);
    console.log(
      `Parent Account: ${parentUserId ? "Created/Linked" : "Pending"}`
    );
    console.log(`Status Updated: accepted`);
    console.log("===========================");

    return NextResponse.json(
      {
        success: true,
        message: "Application accepted and student created",
        student_number: studentNumber,
        student_id: newStudent.id,
        application_status: "accepted", // Confirm status
        parent_created: !!parentUserId,
        parent_user_id: parentUserId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Accept application error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
