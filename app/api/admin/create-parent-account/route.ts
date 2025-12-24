import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
//import { Resend } from "resend";
//const resend = new Resend(process.env.RESEND_API_KEY);
import { resend, emailConfig } from "@/lib/email/resend";

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
        { status: 401 }
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
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, full_name, phone, student_id } = body;

    if (!email || !full_name || !student_id) {
      return NextResponse.json(
        { error: "Missing required fields: email, full_name, student_id" },
        { status: 400 }
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
        { status: 500 }
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
      }
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
          { status: 400 }
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
            (u) => u.email?.toLowerCase() === normalizedEmail
          );

          if (!existingAuthUser) {
            return NextResponse.json(
              { error: "Failed to find existing auth user" },
              { status: 400 }
            );
          }

          parentUserId = existingAuthUser.id;
          console.log("✅ Found existing auth user:", parentUserId);
        } else {
          return NextResponse.json(
            { error: `Failed to create user: ${signUpError.message}` },
            { status: 400 }
          );
        }
      } else if (!newUser.user) {
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 400 }
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
              { status: 400 }
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
          { status: 400 }
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
              redirectTo: `${baseUrl}/parent/set-password`,
            },
          });

        if (!magicLinkError && magicLinkData?.properties?.action_link) {
          console.log("✅ Magic link generated");
          console.log("📧 Sending welcome email...");

          await resend.emails.send({
            from: emailConfig.from,
            to: normalizedEmail,
            subject: "Welcome to Al Hikmah Parent Portal",
            html: `
              <!DOCTYPE html>
              <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 28px;">Welcome to Al Hikmah</h1>
                    <p style="margin: 10px 0 0;">Parent Portal Access</p>
                  </div>
                  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
                    <p>Dear ${full_name},</p>
                    <p>A parent portal account has been created for you at Al Hikmah Institute.</p>
                    <div style="background: white; border: 2px solid #22c55e; border-radius: 8px; padding: 20px; margin: 25px 0;">
                      <p style="margin: 0 0 15px; font-weight: bold;">Your Login Email:</p>
                      <p style="margin: 0; font-size: 18px;">${normalizedEmail}</p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${magicLinkData.properties.action_link}" 
                         style="display: inline-block; background: #22c55e; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold;">
                        Set Password & Login
                      </a>
                    </div>
                  </div>
                </body>
              </html>
            `,
          });

          console.log("✅ Email sent");
        }
      } catch (emailErr) {
        console.error("❌ Email error:", emailErr);
      }
    }

    console.log("🎉 Complete!");

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
      { status: 500 }
    );
  }
}
