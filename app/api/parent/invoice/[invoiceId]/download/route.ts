import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateFeeInvoicePDF } from "@/lib/pdf/invoice-generator";

export async function GET(
  request: Request,
  { params }: { params: { invoiceId: string } }
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

    // Fetch invoice with student verification
    const { data: invoice, error: invoiceError } = await supabase
      .from("fee_invoices")
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
        )
      `
      )
      .eq("id", params.invoiceId)
      .eq("students.parent_student_links.parent_user_id", user.id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found or access denied" },
        { status: 404 }
      );
    }

    // Fetch school settings
    const { data: schoolSettings } = await supabase
      .from("system_settings")
      .select("school_name, school_address, school_email, school_phone")
      .single();

    // Prepare invoice data
    const invoiceData = {
      invoice_number: invoice.invoice_number,
      invoice_date: invoice.generated_date, // ✅ Changed from invoice_date
      due_date: invoice.due_date,
      student_name: `${invoice.students.first_name} ${invoice.students.last_name}`,
      student_number: invoice.students.student_number,
      parent_name: user.user_metadata?.full_name || "Parent",
      parent_email: user.email || "",
      items: [
        {
          description: invoice.period_name || invoice.notes || "Tuition Fee", // ✅ Use period_name/notes
          amount: invoice.amount_due, // ✅ Changed from amount
        },
      ],
      subtotal: invoice.amount_due, // ✅ Changed from amount
      total: invoice.amount_due, // ✅ Changed from amount
      status: invoice.status,
      paid_date: invoice.status === "paid" ? invoice.generated_date : null, // ✅ Calculate paid_date
      payment_method: null, // ✅ This isn't stored on invoices
    };

    const schoolInfo = {
      name: schoolSettings?.school_name,
      address: schoolSettings?.school_address,
      email: schoolSettings?.school_email,
      phone: schoolSettings?.school_phone,
    };

    // Generate PDF
    const pdf = generateFeeInvoicePDF(invoiceData, schoolInfo);
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
