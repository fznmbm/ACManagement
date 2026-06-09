import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
//import { Resend } from "resend";
//const resend = new Resend(process.env.RESEND_API_KEY);
import { resend, emailConfig } from "@/lib/email/resend";
import { logAudit } from "@/lib/utils/auditLogger";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify admin user
    const {
      data: { user: adminUser },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("👤 User check:", {
      userId: adminUser?.id,
      email: adminUser?.email,
    });

    if (!adminUser || userError) {
      console.error("❌ Failed to get user:", userError);
      return NextResponse.json(
        { error: "Unauthorized - Invalid session" },
        { status: 401 },
      );
    }

    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", adminUser.id)
      .single();

    console.log("👮 Admin check:", { role: adminProfile?.role });

    if (
      !adminProfile ||
      !["admin", "super_admin"].includes(adminProfile.role)
    ) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { email, full_name, phone, student_id } = body;

    if (!email || !full_name || !student_id) {
      return NextResponse.json(
        { error: "Missing required fields: email, full_name, student_id" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log("✅ Processing parent account for:", normalizedEmail);

    // Create admin client
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.error("❌ Missing Supabase environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Step 1: Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role")
      .eq("email", normalizedEmail)
      .single();

    let parentUserId: string;
    let isNewUser = false;

    if (existingProfile) {
      console.log("✅ Existing profile found:", existingProfile.email);

      if (existingProfile.role !== "parent") {
        return NextResponse.json(
          {
            error:
              "A user with this email already exists with a different role",
          },
          { status: 400 },
        );
      }

      parentUserId = existingProfile.id;
    } else {
      // Step 2: Try to create auth user (might already exist)
      const tempPassword =
        Math.random().toString(36).slice(-12) +
        Math.random().toString(36).slice(-12);

      console.log("📝 Creating auth user...");

      const { data: newUser, error: signUpError } =
        await supabaseAdmin.auth.admin.createUser({
          email: normalizedEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            full_name,
            role: "parent",
          },
        });

      if (signUpError) {
        console.error("❌ Sign up error:", signUpError);

        // Check if error is because user already exists
        if (
          signUpError.message?.includes("already registered") ||
          signUpError.message?.includes("already exists")
        ) {
          console.log("⚠️ Auth user already exists, fetching existing user...");

          // Try to get existing user by email
          const {
            data: { users },
          } = await supabaseAdmin.auth.admin.listUsers();
          const existingAuthUser = users?.find(
            (u) => u.email?.toLowerCase() === normalizedEmail,
          );

          if (!existingAuthUser) {
            return NextResponse.json(
              { error: "Failed to find existing auth user" },
              { status: 400 },
            );
          }

          parentUserId = existingAuthUser.id;
          console.log("✅ Found existing auth user:", parentUserId);
        } else {
          return NextResponse.json(
            { error: `Failed to create user: ${signUpError.message}` },
            { status: 400 },
          );
        }
      } else if (!newUser.user) {
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 400 },
        );
      } else {
        console.log("✅ Auth user created:", newUser.user.id);
        parentUserId = newUser.user.id;
        isNewUser = true;
      }

      // Step 3: Check if profile exists for this user ID
      const { data: profileByUserId } = await supabaseAdmin
        .from("profiles")
        .select("id, email, role")
        .eq("id", parentUserId)
        .single();

      if (profileByUserId) {
        console.log("✅ Profile already exists for this user ID");

        // Update the profile if needed
        if (
          profileByUserId.email !== normalizedEmail ||
          profileByUserId.role !== "parent"
        ) {
          console.log("📝 Updating existing profile...");
          const { error: updateError } = await supabaseAdmin
            .from("profiles")
            .update({
              email: normalizedEmail,
              full_name,
              phone,
              role: "parent",
            })
            .eq("id", parentUserId);

          if (updateError) {
            console.error("❌ Profile update error:", updateError);
          } else {
            console.log("✅ Profile updated");
          }
        }
      } else {
        // Create new profile
        console.log("📝 Creating profile...");
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .insert({
            id: parentUserId,
            email: normalizedEmail,
            full_name,
            phone,
            role: "parent",
          });

        if (profileError) {
          console.error("❌ Profile creation error:", profileError);

          // If insert fails, try one more time to fetch (race condition)
          const { data: refetchProfile } = await supabaseAdmin
            .from("profiles")
            .select("id")
            .eq("id", parentUserId)
            .single();

          if (!refetchProfile) {
            // Really failed, clean up auth user
            await supabaseAdmin.auth.admin.deleteUser(parentUserId);

            return NextResponse.json(
              { error: `Failed to create profile: ${profileError.message}` },
              { status: 400 },
            );
          }

          console.log("✅ Profile exists after refetch");
        } else {
          console.log("✅ Profile created");
        }
      }
    }

    // Step 4: Check if link already exists
    const { data: existingLink } = await supabase
      .from("parent_student_links")
      .select("id")
      .eq("parent_user_id", parentUserId)
      .eq("student_id", student_id)
      .single();

    if (!existingLink) {
      console.log("📝 Creating parent-student link...");
      const { error: linkError } = await supabase
        .from("parent_student_links")
        .insert({
          parent_user_id: parentUserId,
          student_id: student_id,
        });

      if (linkError) {
        console.error("❌ Link creation error:", linkError);
        return NextResponse.json(
          { error: `Failed to link student: ${linkError.message}` },
          { status: 400 },
        );
      }

      console.log("✅ Student linked to parent");
    } else {
      console.log("✅ Link already exists");
    }

    // Step 5: Send magic link email only if brand new user
    if (isNewUser) {
      try {
        console.log("📧 Generating magic link...");
        // const { data: magicLinkData, error: magicLinkError } =
        //   await supabaseAdmin.auth.admin.generateLink({
        //     type: "magiclink",
        //     email: normalizedEmail,
        //     options: {
        //       redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/parent/set-password`,
        //     },
        //   });

        // Get the base URL from the request
        const requestUrl = new URL(request.url);
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          `${requestUrl.protocol}//${requestUrl.host}`;

        const { data: magicLinkData, error: magicLinkError } =
          await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: normalizedEmail,
            options: {
              redirectTo: `${baseUrl}/auth/callback?next=/set-password`,
            },
          });

        if (!magicLinkError && magicLinkData?.properties?.action_link) {
          console.log("✅ Magic link generated");
          console.log("📧 Sending welcome email...");

          // Fetch linked students for this parent
          const { data: linkedStudents } = await supabaseAdmin
            .from("parent_student_links")
            .select(
              `
    student_id,
    students:student_id (
      student_number,
      first_name,
      last_name
    )
  `,
            )
            .eq("parent_user_id", parentUserId);

          // Build student list HTML
          let studentListHtml = "";
          if (linkedStudents && linkedStudents.length > 0) {
            studentListHtml = linkedStudents
              .map((link: any) => {
                const s = link.students;
                return `<li>${s.first_name} ${s.last_name} (${s.student_number})</li>`;
              })
              .join("");
          }

          await resend.emails.send({
            from: emailConfig.from,
            replyTo: emailConfig.replyTo,
            to: normalizedEmail,
            subject: "Welcome to Al Hikmah Parent Portal",
            html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #22c55e;">Welcome to Al Hikmah Parent Portal! 🎉</h2>
      
      <p>Dear ${full_name},</p>
      
      <p>Your parent portal account has been created. You can now track your child's progress, view attendance, check grades, and stay updated with school activities.</p>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #16a34a;">Your Linked Students</h3>
        <ul style="margin: 10px 0;">
          ${studentListHtml}
        </ul>
      </div>

<div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
  <h3 style="margin-top: 0; color: #2563eb;">Access Your Account</h3>
  
  <p style="margin: 5px 0; background-color: #dbeafe; padding: 10px; border-radius: 5px;">
    <strong>📌 Already have an account?</strong><br>
    If you've previously set up your password, simply <a href="${baseUrl}/parent/login" style="color: #2563eb; font-weight: bold;">log in with your existing credentials</a>.
  </p>
  
  <p style="margin: 15px 0 5px;">
    <strong>🆕 First time?</strong><br>
    Click the button below to set up your password and access the parent portal:
  </p>
  
  <div style="text-align: center; margin: 25px 0;">
    <a href="${magicLinkData.properties.action_link}" 
       style="background-color: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
      Set Up Password
    </a>
  </div>
  
  <p style="margin: 5px 0; font-size: 12px; color: #666;">
    <em>Note: This setup link will expire in 24 hours. If you already have an account, you can ignore this link and use your existing password.</em>
  </p>
</div>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #d97706;">What You Can Do</h3>
        <ul style="margin: 10px 0;">
          <li>Parent Dashboard</li>
          <li>View Attendance </li>
          <li>Track their academic progress.</li>
          
          <li>End-of-Class teacher feedback.</li>
          <li>Submit weekly prayer sheets.</li>
          <li>Manage fees and invoices.</li>
        </ul>
      </div>

      <p>If you have any questions or need assistance, please contact us.</p>
      
      <p>JazakAllah Khair,<br>
      Al Hikmah Institute Team</p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="font-size: 14px; color: #6b7280;">
        <strong>Portal URL:</strong> ${baseUrl}/parent/login<br>
        <strong>Your Email:</strong> ${normalizedEmail}
      </p>
    </div>
  `,
          });

          console.log("✅ Email sent");
        }
      } catch (emailErr) {
        console.error("❌ Email error:", emailErr);
      }
    }

    console.log("🎉 Complete!");

    await logAudit({
      user_id: adminUser.id,
      action: "parent_account_created",
      table_name: "profiles",
      record_id: parentUserId,
      new_values: {
        email: normalizedEmail,
        full_name,
        student_id,
        is_new_user: isNewUser,
      },
    });

    return NextResponse.json({
      success: true,
      message: existingProfile
        ? "Student linked to existing parent account"
        : "Parent account created and linked successfully",
      parent_user_id: parentUserId,
    });
  } catch (error: any) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
