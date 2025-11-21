import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface FeeStructure {
  id: string;
  frequency: string;
  due_day: number;
  amount: number;
}

interface Assignment {
  student_id: string;
}

export async function POST() {
  try {
    const supabase = await createClient();

    // Get all active fee structures with active assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from("student_fee_assignments")
      .select(
        `
        *,
        fee_structures (*)
      `
      )
      .eq("is_active", true)
      .not("fee_structures", "is", null);

    if (assignmentsError) throw assignmentsError;

    let totalGenerated = 0;
    const currentDate = new Date();
    const errors = [];

    for (const assignment of assignments) {
      try {
        const structure = assignment.fee_structures;

        // Calculate period dates
        const { periodStart, periodEnd, dueDate } = calculatePeriod(
          structure,
          currentDate
        );

        // Check if invoice already exists for this period
        const { data: existingInvoice } = await supabase
          .from("fee_invoices")
          .select("id")
          .eq("student_id", assignment.student_id)
          .eq("fee_structure_id", structure.id)
          .eq("period_start", periodStart)
          .eq("period_end", periodEnd)
          .single();

        if (!existingInvoice) {
          // Generate unique invoice number
          const { data: invoiceNumber, error: rpcError } = await supabase.rpc(
            "generate_invoice_number"
          );

          if (rpcError) {
            console.error("Error generating invoice number:", rpcError);
            errors.push(
              `Failed to generate invoice number for student ${assignment.student_id}`
            );
            continue;
          }

          // Create invoice
          const { error: invoiceError } = await supabase
            .from("fee_invoices")
            .insert({
              invoice_number: invoiceNumber,
              student_id: assignment.student_id,
              fee_structure_id: structure.id,
              period_start: periodStart,
              period_end: periodEnd,
              due_date: dueDate,
              amount_due: structure.amount,
              amount_paid: 0,
              status: "pending",
              generated_date: currentDate.toISOString().split("T")[0],
            });

          if (invoiceError) {
            console.error("Error creating invoice:", invoiceError);
            errors.push(
              `Failed to create invoice for student ${assignment.student_id}: ${invoiceError.message}`
            );
          } else {
            totalGenerated++;
          }
        }
      } catch (error) {
        console.error("Error processing assignment:", error);
        errors.push(`Error processing assignment: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      count: totalGenerated,
      message: `Generated ${totalGenerated} invoices successfully`,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error generating invoices:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate invoices" },
      { status: 500 }
    );
  }
}

function calculatePeriod(structure: FeeStructure, currentDate: Date) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11

  let periodStart: string;
  let periodEnd: string;
  let dueDate: string;

  switch (structure.frequency) {
    case "monthly":
      // Current month period
      periodStart = new Date(year, month, 1).toISOString().split("T")[0];
      periodEnd = new Date(year, month + 1, 0).toISOString().split("T")[0];
      dueDate = new Date(year, month, Math.min(structure.due_day || 5, 28))
        .toISOString()
        .split("T")[0];
      break;

    case "quarterly":
      // Current quarter
      const currentQuarter = Math.floor(month / 3); // 0,1,2,3
      const quarterStartMonth = currentQuarter * 3;
      periodStart = new Date(year, quarterStartMonth, 1)
        .toISOString()
        .split("T")[0];
      periodEnd = new Date(year, quarterStartMonth + 3, 0)
        .toISOString()
        .split("T")[0];
      dueDate = new Date(
        year,
        quarterStartMonth,
        Math.min(structure.due_day || 15, 28)
      )
        .toISOString()
        .split("T")[0];
      break;

    case "annually":
      // Current calendar year (can be changed to academic year if needed)
      periodStart = new Date(year, 0, 1).toISOString().split("T")[0]; // Jan 1
      periodEnd = new Date(year, 11, 31).toISOString().split("T")[0]; // Dec 31
      dueDate = new Date(year, 0, Math.min(structure.due_day || 15, 31))
        .toISOString()
        .split("T")[0]; // Due in January
      break;

    case "one_time":
      // Single period starting from assignment date
      periodStart = currentDate.toISOString().split("T")[0];
      periodEnd = currentDate.toISOString().split("T")[0];
      dueDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]; // Due in 30 days
      break;

    default:
      periodStart = currentDate.toISOString().split("T")[0];
      periodEnd = currentDate.toISOString().split("T")[0];
      dueDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
  }

  return { periodStart, periodEnd, dueDate };
}
