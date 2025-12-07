import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type"); // Filter by type
    const unreadOnly = searchParams.get("unread_only") === "true";

    // Build query
    let query = supabase
      .from("parent_notifications")
      .select(
        `
        id,
        type,
        priority,
        title,
        message,
        link_type,
        link_id,
        is_read,
        read_at,
        created_at,
        student:students (
          id,
          first_name,
          last_name,
          student_number
        )
      `
      )
      .eq("parent_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    // Apply filters
    if (type) {
      query = query.eq("type", type);
    }

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("parent_notifications")
      .select("*", { count: "exact", head: true })
      .eq("parent_user_id", user.id)
      .eq("is_read", false);

    return NextResponse.json({
      notifications: notifications || [],
      unread_count: unreadCount || 0,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
