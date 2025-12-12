import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Parse request body for options
    const { dryRun = true } = await request
      .json()
      .catch(() => ({ dryRun: true }));

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the requesting user is a super_admin
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized - No authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Check if user is super_admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden - Super admin access required" },
        { status: 403 }
      );
    }

    console.log(`🧹 Cleanup initiated by: ${user.email}`);
    console.log(
      `🔍 Dry run mode: ${dryRun ? "YES (safe)" : "NO (will delete)"}`
    );

    // Get all auth users
    const { data: authUsersData, error: authError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error fetching auth users:", authError);
      return NextResponse.json(
        { error: "Failed to fetch auth users", details: authError.message },
        { status: 500 }
      );
    }

    const allAuthUsers = authUsersData.users;
    console.log(`📊 Total auth users: ${allAuthUsers.length}`);

    // Get all profile IDs
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role");

    if (profileError) {
      console.error("❌ Error fetching profiles:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch profiles", details: profileError.message },
        { status: 500 }
      );
    }

    const profileIds = new Set(profiles?.map((p) => p.id) || []);
    console.log(`📊 Total profiles: ${profileIds.size}`);

    // Find orphaned auth users (no matching profile)
    const orphanedUsers = allAuthUsers.filter((u) => !profileIds.has(u.id));
    console.log(`🔍 Found ${orphanedUsers.length} orphaned auth users`);

    // Safety filter: Exclude emails with admin, teacher, or specific domains
    // const protectedKeywords = ["admin", "teacher", "test@", "demo@"];
    const protectedKeywords = ["admin", "teacher", "demo@"];
    const safeToDelete = orphanedUsers.filter(
      (u) =>
        !protectedKeywords.some((keyword) =>
          u.email?.toLowerCase().includes(keyword)
        )
    );

    const protectedUsers = orphanedUsers.filter((u) =>
      protectedKeywords.some((keyword) =>
        u.email?.toLowerCase().includes(keyword)
      )
    );

    console.log(`✅ Safe to delete: ${safeToDelete.length}`);
    console.log(`⚠️ Protected (skipped): ${protectedUsers.length}`);

    const deletionResults = {
      dryRun,
      totalAuthUsers: allAuthUsers.length,
      totalProfiles: profileIds.size,
      orphanedFound: orphanedUsers.length,
      safeToDelete: safeToDelete.length,
      protectedSkipped: protectedUsers.length,
      deleted: [] as string[],
      protected: protectedUsers.map((u) => u.email || "no-email"),
      errors: [] as string[],
    };

    // Delete orphaned auth users (if not dry run)
    if (!dryRun) {
      console.log(`🗑️ Starting deletion of ${safeToDelete.length} users...`);

      for (const user of safeToDelete) {
        try {
          const { error: deleteError } =
            await supabaseAdmin.auth.admin.deleteUser(user.id);

          if (deleteError) {
            console.error(
              `❌ Failed to delete ${user.email}:`,
              deleteError.message
            );
            deletionResults.errors.push(
              `${user.email}: ${deleteError.message}`
            );
          } else {
            console.log(`✅ Deleted: ${user.email}`);
            deletionResults.deleted.push(user.email || user.id);
          }
        } catch (err: any) {
          console.error(`❌ Exception deleting ${user.email}:`, err);
          deletionResults.errors.push(`${user.email}: ${err.message}`);
        }
      }

      console.log(
        `✅ Deletion complete: ${deletionResults.deleted.length} users deleted`
      );
    } else {
      console.log("ℹ️ Dry run - No users were deleted");
      deletionResults.deleted = safeToDelete.map((u) => u.email || u.id);
    }

    // Log to database (optional - create an audit log table if needed)
    // await supabaseAdmin.from('admin_actions_log').insert({
    //   action: 'cleanup_orphaned_auth',
    //   performed_by: user.id,
    //   dry_run: dryRun,
    //   users_deleted: deletionResults.deleted.length,
    //   details: deletionResults
    // });

    return NextResponse.json({
      success: true,
      message: dryRun
        ? "Dry run completed - no users were deleted"
        : `Successfully deleted ${deletionResults.deleted.length} orphaned auth users`,
      results: deletionResults,
    });
  } catch (error: any) {
    console.error("❌ Cleanup error:", error);
    return NextResponse.json(
      {
        error: "Failed to cleanup orphaned auth users",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to preview orphaned users (no deletion)
export async function GET(request: NextRequest) {
  try {
    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is super_admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all auth users
    const { data: authUsersData } = await supabaseAdmin.auth.admin.listUsers();
    const allAuthUsers = authUsersData?.users || [];

    // Get all profile IDs
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id");
    const profileIds = new Set(profiles?.map((p) => p.id) || []);

    // Find orphaned users
    const orphanedUsers = allAuthUsers
      .filter((u) => !profileIds.has(u.id))
      .map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      }));

    return NextResponse.json({
      totalAuthUsers: allAuthUsers.length,
      totalProfiles: profileIds.size,
      orphanedUsers,
      orphanedCount: orphanedUsers.length,
    });
  } catch (error: any) {
    console.error("❌ Preview error:", error);
    return NextResponse.json(
      { error: "Failed to preview orphaned users", details: error.message },
      { status: 500 }
    );
  }
}
