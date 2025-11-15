import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { category, data: settingsData } = body;

    // Upsert settings based on category
    const { error } = await supabase.from("system_settings").upsert(
      {
        setting_key: category,
        setting_value: settingsData,
        category: category,
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
