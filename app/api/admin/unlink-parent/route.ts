import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify admin user
    const {
      data: { user: adminUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (!adminUser || userError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", adminUser.id)
      .single();

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
    const { parent_user_id, student_id } = body;

    if (!parent_user_id || !student_id) {
      return NextResponse.json(
        { error: "Missing parent_user_id or student_id" },
        { status: 400 }
      );
    }

    console.log(
      "🔓 Unlinking student:",
      student_id,
      "from parent:",
      parent_user_id
    );

    // Step 1: Delete the link
    const { error: unlinkError } = await supabase
      .from("parent_student_links")
      .delete()
      .eq("parent_user_id", parent_user_id)
      .eq("student_id", student_id);

    if (unlinkError) {
      console.error("❌ Unlink error:", unlinkError);
      return NextResponse.json(
        { error: `Failed to unlink: ${unlinkError.message}` },
        { status: 400 }
      );
    }

    console.log("✅ Link deleted");

    // Step 2: Check if parent has any other linked students
    const { data: otherLinks, error: checkError } = await supabase
      .from("parent_student_links")
      .select("id")
      .eq("parent_user_id", parent_user_id);

    if (checkError) {
      console.error("⚠️ Error checking other links:", checkError);
      // Continue anyway, link is already deleted
    }

    let deletedParentAccount = false;

    // Step 3: If no other students linked, delete parent account
    if (!otherLinks || otherLinks.length === 0) {
      console.log("🗑️ No other students linked, deleting parent account...");

      // Create admin client
      if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.SUPABASE_SERVICE_ROLE_KEY
      ) {
        console.error("❌ Missing Supabase environment variables");
        return NextResponse.json(
          {
            success: true,
            message: "Student unlinked, but could not delete parent account",
            deleted_parent: false,
          },
          { status: 200 }
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

      // Delete profile first (will cascade to auth if triggers are set up)
      const { error: profileDeleteError } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", parent_user_id);

      if (profileDeleteError) {
        console.error("⚠️ Profile delete error:", profileDeleteError);
      }

      // Delete auth user
      const { error: authDeleteError } =
        await supabaseAdmin.auth.admin.deleteUser(parent_user_id);

      if (authDeleteError) {
        console.error("⚠️ Auth delete error:", authDeleteError);
      } else {
        console.log("✅ Parent account deleted");
        deletedParentAccount = true;
      }
    } else {
      console.log(
        `✅ Parent still has ${otherLinks.length} other student(s) linked`
      );
    }

    return NextResponse.json({
      success: true,
      message: deletedParentAccount
        ? "Student unlinked and parent account deleted (no other students)"
        : "Student unlinked successfully",
      deleted_parent: deletedParentAccount,
    });
  } catch (error: any) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
