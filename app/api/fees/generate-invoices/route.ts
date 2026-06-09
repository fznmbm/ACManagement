import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface FeeStructure {
  id: string;
  frequency: string;
  due_day: number;
  amount: number;
  use_custom_quarters?: boolean;
}

interface Assignment {
  student_id: string;
  start_date: string;
  fee_structures: FeeStructure;
}

interface Quarter {
  id: string;
  quarter_number: number;
  quarter_name: string;
  start_month: number;
  end_month: number;
}

// export async function POST() {
//   try {
//     const supabase = await createClient();
export async function POST() {
  try {
    const supabase = await createClient();

    // Get all active fee structures with active assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from("student_fee_assignments")
      .select(`*, fee_structures (*)`)
      .eq("is_active", true)
      .not("fee_structures", "is", null);

    if (assignmentsError) throw assignmentsError;

    let totalGenerated = 0;
    const currentDate = new Date();
    const errors = [];

    // Get custom quarters for quarterly fee structures
    const { data: customQuarters } = await supabase
      .from("fee_quarter_settings")
      .select("*")
      .eq("is_active", true)
      .order("quarter_number");

    for (const assignment of assignments) {
      try {
        const structure = assignment.fee_structures;

        // Use assignment start_date if available, otherwise today
        const assignmentStartDate = assignment.start_date
          ? new Date(assignment.start_date)
          : currentDate;

        // Calculate period dates based on frequency and start date
        const periodResult = calculatePeriod(
          structure,
          currentDate,
          assignmentStartDate,
          customQuarters || [],
        );

        if (!periodResult) {
          errors.push(
            `Failed to calculate period for student ${assignment.student_id}`,
          );
          continue;
        }

        const { periodStart, periodEnd, dueDate, periodName } = periodResult;

        // Check if invoice already exists for this period
        const { data: existingInvoice } = await supabase
          .from("fee_invoices")
          .select("id")
          .eq("student_id", assignment.student_id)
          .eq("fee_structure_id", structure.id)
          .eq("period_start", periodStart)
          .single();

        if (!existingInvoice) {
          // Generate unique invoice number
          const { data: invoiceNumber, error: rpcError } = await supabase.rpc(
            "generate_invoice_number",
          );

          if (rpcError) {
            errors.push(
              `Failed to generate invoice number for student ${assignment.student_id}`,
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
              period_name: periodName,
              due_date: dueDate,
              amount_due: structure.amount,
              amount_paid: 0,
              status: "pending",
              generated_date: currentDate.toISOString().split("T")[0],
            });

          if (invoiceError) {
            errors.push(
              `Failed to create invoice for student ${assignment.student_id}: ${invoiceError.message}`,
            );
          } else {
            totalGenerated++;
          }
        }
      } catch (error: any) {
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
      { status: 500 },
    );
  }
}

function calculatePeriod(
  structure: FeeStructure,
  currentDate: Date,
  assignmentStartDate: Date,
  customQuarters: Quarter[],
): {
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  periodName: string;
} | null {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  const dueDay = structure.due_day || 15;

  let periodStart: string;
  let periodEnd: string;
  let dueDate: string;
  let periodName: string;

  switch (structure.frequency) {
    case "quarterly": {
      if (structure.use_custom_quarters && customQuarters.length > 0) {
        const currentQuarter = getCurrentCustomQuarter(
          currentDate,
          customQuarters,
        );
        if (!currentQuarter) return null;
        const range = getCustomQuarterDateRange(currentQuarter, year);
        periodStart = range.startDate.toISOString().split("T")[0];
        periodEnd = range.endDate.toISOString().split("T")[0];
        dueDate = range.startDate.toISOString().split("T")[0];
        const endYear =
          currentQuarter.start_month > currentQuarter.end_month
            ? year + 1
            : year;
        periodName = `${currentQuarter.quarter_name} ${year}${endYear !== year ? "/" + endYear : ""}`;
      } else {
        // Standard calendar quarters: Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec
        const currentQ = Math.floor(month / 3);
        const qStartMonth = currentQ * 3;
        periodStart = new Date(year, qStartMonth, 1)
          .toISOString()
          .split("T")[0];
        periodEnd = new Date(year, qStartMonth + 3, 0)
          .toISOString()
          .split("T")[0];
        dueDate = new Date(year, qStartMonth, Math.min(dueDay, 28))
          .toISOString()
          .split("T")[0];
        periodName = `Q${currentQ + 1} ${year}`;
      }
      break;
    }

    case "biannual":
    case "biannually": {
      // Two periods per year based on assignment start date
      // Period 1: start_date month → start_date month + 5 months
      // Period 2: start_date month + 6 → start_date month + 11 months

      const startMonth = assignmentStartDate.getMonth(); // 0-11
      const startDay = assignmentStartDate.getDate();

      // Determine which half of the year we're in relative to start date
      const monthsSinceStart = (month - startMonth + 12) % 12;
      const isSecondHalf = monthsSinceStart >= 6;

      let p1StartMonth: number;
      let p1StartYear: number;

      if (!isSecondHalf) {
        // We're in the first period of the current cycle
        p1StartMonth = startMonth;
        p1StartYear = year;
        // If we haven't reached start month yet this year, use last year's second period start
        if (month < startMonth) {
          p1StartYear = year - 1;
        }
      } else {
        // We're in the second period
        p1StartMonth = (startMonth + 6) % 12;
        p1StartYear = startMonth + 6 >= 12 ? year + 1 : year;
        if (month < startMonth && !isSecondHalf) {
          p1StartYear = year - 1;
        }
      }

      const pStart = new Date(p1StartYear, p1StartMonth, startDay);
      const pEnd = new Date(p1StartYear, p1StartMonth + 6, startDay - 1);

      periodStart = pStart.toISOString().split("T")[0];
      periodEnd = pEnd.toISOString().split("T")[0];
      dueDate = new Date(p1StartYear, p1StartMonth, Math.min(dueDay, 28))
        .toISOString()
        .split("T")[0];

      const halfLabel = isSecondHalf ? "H2" : "H1";
      periodName = `${halfLabel} ${p1StartYear} (${getMonthName(p1StartMonth)} – ${getMonthName((p1StartMonth + 5) % 12)})`;
      break;
    }

    case "annually":
    case "annual": {
      // Annual period from assignment start date
      const annualStart = new Date(
        year,
        assignmentStartDate.getMonth(),
        assignmentStartDate.getDate(),
      );
      const annualEnd = new Date(
        year + 1,
        assignmentStartDate.getMonth(),
        assignmentStartDate.getDate() - 1,
      );
      periodStart = annualStart.toISOString().split("T")[0];
      periodEnd = annualEnd.toISOString().split("T")[0];
      dueDate = new Date(
        year,
        assignmentStartDate.getMonth(),
        Math.min(dueDay, 28),
      )
        .toISOString()
        .split("T")[0];
      periodName = `Academic Year ${year}–${year + 1}`;
      break;
    }

    case "one_time":
    case "one-time":
    case "one_off": {
      // One-time: use assignment start date as period, due in 30 days
      periodStart = assignmentStartDate.toISOString().split("T")[0];
      periodEnd = assignmentStartDate.toISOString().split("T")[0];
      dueDate = new Date(
        assignmentStartDate.getTime() + 30 * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split("T")[0];
      periodName = `One-off Fee`;
      break;
    }

    default: {
      // Fallback — use today
      periodStart = currentDate.toISOString().split("T")[0];
      periodEnd = currentDate.toISOString().split("T")[0];
      dueDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      periodName = `Fee ${year}`;
      break;
    }
  }

  return { periodStart, periodEnd, dueDate, periodName };
}

function getCurrentCustomQuarter(
  date: Date,
  quarters: Quarter[],
): Quarter | null {
  const month = date.getMonth() + 1;
  return (
    quarters.find((q) => {
      if (q.start_month <= q.end_month)
        return month >= q.start_month && month <= q.end_month;
      return month >= q.start_month || month <= q.end_month;
    }) || null
  );
}

function getCustomQuarterDateRange(
  quarter: Quarter,
  year: number,
): { startDate: Date; endDate: Date } {
  const startDate = new Date(year, quarter.start_month - 1, 1);
  const endYear = quarter.start_month > quarter.end_month ? year + 1 : year;
  const endDate = new Date(endYear, quarter.end_month, 0);
  return { startDate, endDate };
}

function getMonthName(month: number): string {
  return [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ][month];
}
