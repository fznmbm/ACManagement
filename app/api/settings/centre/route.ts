// app/api/settings/centre/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the request body
    const formData = await request.json();

    // Upsert the settings
    const { error } = await supabase.from("system_settings").upsert(
      {
        setting_key: "centre_info",
        setting_value: formData,
        category: "general",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "setting_key",
      }
    );

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
