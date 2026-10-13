// File: app/api/users/create/route.ts
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { logAudit } from "@/lib/utils/auditLogger";
import { resend, emailConfig } from "@/lib/email/resend";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  teacher: "Teacher",
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Only super_admins may create staff
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: requesterProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!requesterProfile || requesterProfile.role !== "super_admin") {
      return NextResponse.json(
        { error: "Only super admins can create users" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { email, fullName, role } = body;
    // Password is optional now: when omitted we email a set-password invite
    // instead of handing the admin a credential to copy. A password may still
    // be supplied to set one directly (legacy behaviour).
    const password: string | undefined = body.password?.trim()
      ? body.password
      : undefined;

    if (!email || !fullName || !role) {
      return NextResponse.json(
        { error: "Email, full name, and role are required" },
        { status: 400 },
      );
    }
    if (password && password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }
    const validRoles = ["super_admin", "admin", "teacher"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const invite = !password;

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Create the auth user. In invite mode we set a random temporary password
    // the user never sees; the emailed link lets them set their own.
    const tempPassword =
      password ||
      Math.random().toString(36).slice(-12) +
        Math.random().toString(36).slice(-12) +
        "Aa1!";

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName, role },
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message || "Failed to create user" },
        { status: 400 },
      );
    }
    if (!authData?.user) {
      return NextResponse.json(
        { error: "Failed to create user - no data returned" },
        { status: 400 },
      );
    }

    // The handle_new_user trigger usually creates the profile; wait, then
    // upsert the role/name either way.
    await new Promise((r) => setTimeout(r, 500));
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", authData.user.id)
      .single();

    const profileError = existingProfile
      ? (
          await supabaseAdmin
            .from("profiles")
            .update({ full_name: fullName, role })
            .eq("id", authData.user.id)
        ).error
      : (
          await supabaseAdmin
            .from("profiles")
            .insert({ id: authData.user.id, email: normalizedEmail, full_name: fullName, role })
        ).error;

    if (profileError) {
      console.error("Profile error:", profileError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 400 },
      );
    }

    // In invite mode, email a set-password link (mirrors the parent invite).
    let emailSent = false;
    if (invite) {
      try {
        const requestUrl = new URL(request.url);
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          `${requestUrl.protocol}//${requestUrl.host}`;

        const { data: linkData, error: linkError } =
          await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: normalizedEmail,
            options: { redirectTo: `${baseUrl}/auth/callback?next=/set-password` },
          });

        if (!linkError && linkData?.properties?.action_link) {
          await resend.emails.send({
            from: emailConfig.from,
            replyTo: emailConfig.replyTo,
            to: normalizedEmail,
            subject: "Your Al Hikmah Institute staff account",
            html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color:#116a4c;">Welcome to Al Hikmah Institute Crawley</h2>
      <p>An account has been created for you as <strong>${ROLE_LABELS[role] || role}</strong>.</p>
      <p>Click the button below to set your password and sign in:</p>
      <p style="margin:24px 0;">
        <a href="${linkData.properties.action_link}"
           style="background:#116a4c;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;">
          Set your password
        </a>
      </p>
      <p style="color:#555;font-size:13px;">If the button doesn't work, copy this link into your browser:</p>
      <p style="word-break:break-all;font-size:12px;color:#555;">${linkData.properties.action_link}</p>
      <p style="color:#888;font-size:12px;margin-top:24px;">If you weren't expecting this, you can ignore this email.</p>
    </div>`,
          });
          emailSent = true;
        } else if (linkError) {
          console.error("generateLink error:", linkError);
        }
      } catch (e) {
        console.error("Invite email failed:", e);
      }
    }

    await logAudit({
      user_id: user.id,
      action: "create",
      table_name: "profiles",
      record_id: authData.user.id,
      new_values: { email: normalizedEmail, full_name: fullName, role, invited: invite },
    });

    return NextResponse.json({
      success: true,
      invited: invite,
      emailSent,
      user: {
        id: authData.user.id,
        email: normalizedEmail,
        full_name: fullName,
        role,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
