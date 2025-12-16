// File: app/api/users/create/route.ts

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if requester is super_admin
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
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { email, password, fullName, role } = body;

    // Validate input
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: "Email, password, full name, and role are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const validRoles = ["super_admin", "admin", "teacher"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Create user using Supabase Admin API
    // We need to use the service role key for this

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // // Create auth user
    // const { data: authData, error: authError } =
    //   await supabaseAdmin.auth.admin.createUser({
    //     email,
    //     password,
    //     email_confirm: true, // Auto-confirm email
    //     user_metadata: {
    //       full_name: fullName,
    //     },
    //   });

    // if (authError) {
    //   console.error("Auth error:", authError);
    //   return NextResponse.json(
    //     { error: authError.message || "Failed to create user" },
    //     { status: 400 }
    //   );
    // }

    // Create auth user with detailed logging
    console.log("🔐 Creating auth user...");
    console.log("📧 Email:", email);
    console.log("🔑 Password length:", password.length);
    console.log("👤 Full name:", fullName);

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

    console.log("✅ Auth Data:", authData);
    console.log("❌ Auth Error:", authError);

    if (authError) {
      console.error("🚨 AUTH CREATION FAILED:", authError);
      console.error("Error details:", JSON.stringify(authError, null, 2));
      return NextResponse.json(
        { error: authError.message || "Failed to create user" },
        { status: 400 }
      );
    }

    if (!authData || !authData.user) {
      console.error("🚨 No user data returned!");
      return NextResponse.json(
        { error: "Failed to create user - no data returned" },
        { status: 400 }
      );
    }

    console.log("✅ User created in auth.users:", authData.user.id);

    // Get organization_id from requester's profile
    // const { data: orgData } = await supabase
    //   .from("profiles")
    //   .select("organization_id")
    //   .eq("id", user.id)
    //   .single();

    // // Create profile
    // const { error: profileError } = await supabase.from("profiles").insert({
    //   id: authData.user.id,
    //   email,
    //   full_name: fullName,
    //   role,
    //   organization_id: orgData?.organization_id || null,
    // });

    // Wait for trigger to create profile
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", authData.user.id)
      .single();

    let profileError = null;

    if (existingProfile) {
      // Profile exists (created by trigger), update it
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({
          full_name: fullName,
          role,
          // organization_id: orgData?.organization_id || null,
        })
        .eq("id", authData.user.id);
      profileError = error;
    } else {
      // Profile doesn't exist (trigger failed?), create it
      const { error } = await supabaseAdmin.from("profiles").insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
        // organization_id: orgData?.organization_id || null,
      });
      profileError = error;
    }

    if (profileError) {
      console.error("Profile error:", profileError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 400 }
      );
    }

    if (profileError) {
      console.error("Profile error:", profileError);
      // Try to delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        full_name: fullName,
        role,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
