import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // Run all alert checks
    const results = {
      absences: { success: false, error: null },
      upcoming_fees: { success: false, error: null },
      overdue_fees: { success: false, error: null },
    };

    // Check consecutive absences
    try {
      await supabase.rpc("check_consecutive_absences");
      results.absences.success = true;
    } catch (error: any) {
      results.absences.error = error.message;
      console.error("Error checking absences:", error);
    }

    // Check upcoming fee dues
    try {
      await supabase.rpc("check_upcoming_fee_dues");
      results.upcoming_fees.success = true;
    } catch (error: any) {
      results.upcoming_fees.error = error.message;
      console.error("Error checking upcoming fees:", error);
    }

    // Check overdue fees
    try {
      await supabase.rpc("check_overdue_fees");
      results.overdue_fees.success = true;
    } catch (error: any) {
      results.overdue_fees.error = error.message;
      console.error("Error checking overdue fees:", error);
    }

    const allSuccess =
      results.absences.success &&
      results.upcoming_fees.success &&
      results.overdue_fees.success;

    return NextResponse.json(
      {
        success: allSuccess,
        timestamp: new Date().toISOString(),
        results,
      },
      {
        status: allSuccess ? 200 : 207, // 207 = Multi-Status (partial success)
      }
    );
  } catch (error) {
    console.error("Error in daily alerts cron:", error);
    return NextResponse.json(
      {
        error: "Failed to run daily alerts",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
