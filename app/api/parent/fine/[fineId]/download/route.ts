import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateFineReceiptPDF } from "@/lib/pdf/invoice-generator";

export async function GET(
  request: Request,
  { params }: { params: { fineId: string } }
) {
  try {
    const supabase = await createClient();

    // Verify parent user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify parent role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "parent") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch fine with student verification
    const { data: fine, error: fineError } = await supabase
      .from("fines")
      .select(
        `
    *,
    students (
      id,
      student_number,
      first_name,
      last_name,
      parent_student_links!inner (
        parent_user_id
      )
    ),
    attendance:attendance_record_id (
      date,
      status
    )
  `
      )
      .eq("id", params.fineId)
      .eq("students.parent_student_links.parent_user_id", user.id)
      .single();

    if (fineError || !fine) {
      return NextResponse.json(
        { error: "Fine not found or access denied" },
        { status: 404 }
      );
    }

    // Fetch school settings
    const { data: schoolSettings } = await supabase
      .from("system_settings")
      .select("school_name, school_address, school_email, school_phone")
      .single();

    // Prepare receipt data
    const receiptData = {
      receipt_number: `FINE-${fine.id.slice(0, 8).toUpperCase()}`,
      issue_date: fine.issued_date, // ✅ Changed from created_at
      student_name: `${fine.students.first_name} ${fine.students.last_name}`,
      student_number: fine.students.student_number,
      parent_name: user.user_metadata?.full_name || "Parent",
      fine_type: fine.fine_type === "late" ? "Late Arrival" : "Absence", // ✅ Use fine.fine_type
      fine_reason: `${
        fine.fine_type === "late" ? "Late arrival" : "Absence"
      } on ${new Date(fine.attendance?.date).toLocaleDateString(
        // ✅ Changed from attendance_date
        "en-GB"
      )}`,
      amount: fine.amount,
      status: fine.status,
      paid_date: fine.paid_date,
      payment_method: fine.payment_method,
    };

    const schoolInfo = {
      name: schoolSettings?.school_name,
      address: schoolSettings?.school_address,
      email: schoolSettings?.school_email,
      phone: schoolSettings?.school_phone,
    };

    // Generate PDF
    const pdf = generateFineReceiptPDF(receiptData, schoolInfo);
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="fine-receipt-${fine.id.slice(
          0,
          8
        )}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating fine receipt PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
