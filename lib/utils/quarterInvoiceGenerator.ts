import { createClient } from "@/lib/supabase/client";

interface Quarter {
  id: string;
  quarter_number: number;
  quarter_name: string;
  start_month: number;
  end_month: number;
}

interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  use_custom_quarters: boolean;
}

export class QuarterInvoiceGenerator {
  private supabase = createClient();

  /**
   * Get custom quarters from database
   */
  private async getCustomQuarters(): Promise<Quarter[]> {
    const { data, error } = await this.supabase
      .from("fee_quarter_settings")
      .select("*")
      .eq("is_active", true)
      .order("quarter_number");

    if (error) throw error;
    return data || [];
  }

  /**
   * Determine which quarter a given date falls into
   */
  private getQuarterForDate(date: Date, quarters: Quarter[]): Quarter | null {
    const month = date.getMonth() + 1; // JavaScript months are 0-based

    return (
      quarters.find((quarter) => {
        const { start_month, end_month } = quarter;

        if (start_month <= end_month) {
          // Normal quarter (e.g., March to May)
          return month >= start_month && month <= end_month;
        } else {
          // Cross-year quarter (e.g., December to February)
          return month >= start_month || month <= end_month;
        }
      }) || null
    );
  }

  /**
   * Get the date range for a specific quarter in a given year
   */
  private getQuarterDateRange(
    quarter: Quarter,
    year: number
  ): { startDate: Date; endDate: Date } {
    const startDate = new Date(year, quarter.start_month - 1, 1);

    let endYear = year;
    if (quarter.start_month > quarter.end_month) {
      // Cross-year quarter - end month is in the next year
      endYear = year + 1;
    }

    // Last day of the end month
    const endDate = new Date(endYear, quarter.end_month, 0);

    return { startDate, endDate };
  }

  /**
   * Get standard calendar quarter date range
   */
  private getStandardQuarterDateRange(
    quarterNumber: number,
    year: number
  ): { startDate: Date; endDate: Date } {
    const quarterMap = {
      1: { start: 0, end: 2 }, // Jan-Mar (months 0-2)
      2: { start: 3, end: 5 }, // Apr-Jun (months 3-5)
      3: { start: 6, end: 8 }, // Jul-Sep (months 6-8)
      4: { start: 9, end: 11 }, // Oct-Dec (months 9-11)
    };

    const quarter = quarterMap[quarterNumber as keyof typeof quarterMap];
    const startDate = new Date(year, quarter.start, 1);
    const endDate = new Date(year, quarter.end + 1, 0); // Last day of end month

    return { startDate, endDate };
  }

  /**
   * Generate quarterly invoices for a specific fee structure
   */
  async generateQuarterlyInvoices(
    feeStructure: FeeStructure,
    studentIds: string[],
    targetYear: number = new Date().getFullYear()
  ) {
    const invoices = [];

    try {
      if (feeStructure.use_custom_quarters) {
        // Use custom quarters
        const customQuarters = await this.getCustomQuarters();

        if (customQuarters.length === 0) {
          throw new Error(
            "No active custom quarters found. Please configure quarters in settings."
          );
        }

        for (const quarter of customQuarters) {
          const { startDate, endDate } = this.getQuarterDateRange(
            quarter,
            targetYear
          );

          // Calculate due date (e.g., first day of the quarter)
          const dueDate = new Date(startDate);

          for (const studentId of studentIds) {
            const invoice = {
              student_id: studentId,
              fee_structure_id: feeStructure.id,
              invoice_number: await this.generateInvoiceNumber(),
              amount_due: feeStructure.amount,
              amount_paid: 0,
              due_date: dueDate.toISOString().split("T")[0],
              period_start: startDate.toISOString().split("T")[0],
              period_end: endDate.toISOString().split("T")[0],
              period_name: `${quarter.quarter_name} ${targetYear}${
                quarter.start_month > quarter.end_month
                  ? "/" + (targetYear + 1)
                  : ""
              }`,
              status: "pending",
              generated_date: new Date().toISOString().split("T")[0],
            };

            invoices.push(invoice);
          }
        }
      } else {
        // Use standard calendar quarters
        for (let quarterNum = 1; quarterNum <= 4; quarterNum++) {
          const { startDate, endDate } = this.getStandardQuarterDateRange(
            quarterNum,
            targetYear
          );
          const dueDate = new Date(startDate);

          for (const studentId of studentIds) {
            const invoice = {
              student_id: studentId,
              fee_structure_id: feeStructure.id,
              invoice_number: await this.generateInvoiceNumber(),
              amount_due: feeStructure.amount,
              amount_paid: 0,
              due_date: dueDate.toISOString().split("T")[0],
              period_start: startDate.toISOString().split("T")[0],
              period_end: endDate.toISOString().split("T")[0],
              period_name: `Q${quarterNum} ${targetYear}`,
              status: "pending",
              generated_date: new Date().toISOString().split("T")[0],
            };

            invoices.push(invoice);
          }
        }
      }

      // Insert invoices into database
      if (invoices.length > 0) {
        const { data, error } = await this.supabase
          .from("fee_invoices")
          .insert(invoices)
          .select();

        if (error) throw error;
        return data;
      }

      return [];
    } catch (error) {
      console.error("Error generating quarterly invoices:", error);
      throw error;
    }
  }

  /**
   * Generate next quarter invoices based on current date
   */
  async generateNextQuarterInvoices(
    feeStructure: FeeStructure,
    studentIds: string[]
  ) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();

    if (feeStructure.use_custom_quarters) {
      const customQuarters = await this.getCustomQuarters();
      const currentQuarter = this.getQuarterForDate(
        currentDate,
        customQuarters
      );

      if (currentQuarter) {
        // Find next quarter
        const nextQuarterNumber =
          currentQuarter.quarter_number === 4
            ? 1
            : currentQuarter.quarter_number + 1;
        const nextQuarter = customQuarters.find(
          (q) => q.quarter_number === nextQuarterNumber
        );

        if (nextQuarter) {
          // Determine year (might be next year if we're going from Q4 to Q1)
          const targetYear =
            nextQuarterNumber === 1 && currentQuarter.quarter_number === 4
              ? currentYear + 1
              : currentYear;

          const { startDate, endDate } = this.getQuarterDateRange(
            nextQuarter,
            targetYear
          );
          const dueDate = new Date(startDate);

          // const invoices = studentIds.map((studentId) => ({
          //   student_id: studentId,
          //   fee_structure_id: feeStructure.id,
          //   invoice_number: await this.generateInvoiceNumber(),
          //   amount_due: feeStructure.amount,
          //   amount_paid: 0,
          //   due_date: dueDate.toISOString().split("T")[0],
          //   period_start: startDate.toISOString().split("T")[0],
          //   period_end: endDate.toISOString().split("T")[0],
          //   period_name: `${nextQuarter.quarter_name} ${targetYear}${
          //     nextQuarter.start_month > nextQuarter.end_month
          //       ? "/" + (targetYear + 1)
          //       : ""
          //   }`,
          //   status: "pending",
          //   generated_date: new Date().toISOString().split("T")[0],
          // }));

          const invoices = [];
          for (const studentId of studentIds) {
            const invoiceNumber = await this.generateInvoiceNumber();
            invoices.push({
              student_id: studentId,
              fee_structure_id: feeStructure.id,
              invoice_number: invoiceNumber, // ✅ FIXED
              amount_due: feeStructure.amount,
              amount_paid: 0,
              due_date: dueDate.toISOString().split("T")[0],
              period_start: startDate.toISOString().split("T")[0],
              period_end: endDate.toISOString().split("T")[0],
              period_name: `${nextQuarter.quarter_name} ${targetYear}${
                nextQuarter.start_month > nextQuarter.end_month
                  ? "/" + (targetYear + 1)
                  : ""
              }`,
              status: "pending",
              generated_date: new Date().toISOString().split("T")[0],
            });
          }

          const { data, error } = await this.supabase
            .from("fee_invoices")
            .insert(invoices)
            .select();

          if (error) throw error;
          return data;
        }
      }
    }

    // Fallback to standard quarterly logic if needed
    throw new Error("Could not determine next quarter for invoice generation");
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");

    // Get count of invoices this month
    const { count } = await this.supabase
      .from("fee_invoices")
      .select("*", { count: "exact", head: true })
      .ilike("invoice_number", `INV-${year}${month}%`);

    const sequence = ((count || 0) + 1).toString().padStart(4, "0");
    return `INV-${year}${month}-${sequence}`;
  }

  /**
   * Get current quarter information
   */
  async getCurrentQuarterInfo(useCustomQuarters: boolean = true) {
    const currentDate = new Date();

    if (useCustomQuarters) {
      const customQuarters = await this.getCustomQuarters();
      const currentQuarter = this.getQuarterForDate(
        currentDate,
        customQuarters
      );

      if (currentQuarter) {
        const currentYear = currentDate.getFullYear();
        const { startDate, endDate } = this.getQuarterDateRange(
          currentQuarter,
          currentYear
        );

        return {
          quarter: currentQuarter,
          startDate,
          endDate,
          year: currentYear,
        };
      }
    }

    // Fallback to standard quarter
    const month = currentDate.getMonth() + 1;
    const standardQuarter = Math.ceil(month / 3);
    const year = currentDate.getFullYear();
    const { startDate, endDate } = this.getStandardQuarterDateRange(
      standardQuarter,
      year
    );

    return {
      quarter: {
        quarter_number: standardQuarter,
        quarter_name: `Q${standardQuarter}`,
        start_month: startDate.getMonth() + 1,
        end_month: endDate.getMonth() + 1,
      },
      startDate,
      endDate,
      year,
    };
  }
}

// Export a singleton instance
export const quarterInvoiceGenerator = new QuarterInvoiceGenerator();
