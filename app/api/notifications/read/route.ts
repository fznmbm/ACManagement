import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notification_id, mark_all } = body;

    if (mark_all) {
      // Mark all as read
      const { error } = await supabase
        .from("parent_notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("parent_user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    } else if (notification_id) {
      // Mark single notification as read
      const { error } = await supabase
        .from("parent_notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", notification_id)
        .eq("parent_user_id", user.id);

      if (error) throw error;

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
