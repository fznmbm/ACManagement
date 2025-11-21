import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Quarter {
  id: string;
  quarter_number: number;
  quarter_name: string;
  start_month: number;
  end_month: number;
  is_active: boolean;
}

export const useCustomQuarters = () => {
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchQuarters = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("fee_quarter_settings")
        .select("*")
        .eq("is_active", true)
        .order("quarter_number");

      if (fetchError) throw fetchError;

      setQuarters(data || []);
    } catch (err: any) {
      console.error("Error fetching quarters:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuarters();
  }, []);

  const getQuarterByNumber = (quarterNumber: number) => {
    return quarters.find((q) => q.quarter_number === quarterNumber);
  };

  const getQuarterForDate = (date: Date) => {
    const month = date.getMonth() + 1; // JavaScript months are 0-based

    return quarters.find((quarter) => {
      const { start_month, end_month } = quarter;

      if (start_month <= end_month) {
        // Normal quarter (e.g., March to May)
        return month >= start_month && month <= end_month;
      } else {
        // Cross-year quarter (e.g., December to February)
        return month >= start_month || month <= end_month;
      }
    });
  };

  const getCurrentQuarter = () => {
    return getQuarterForDate(new Date());
  };

  const getQuarterMonthNames = (quarter: Quarter) => {
    const monthNames = [
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
    ];

    if (quarter.start_month <= quarter.end_month) {
      return `${monthNames[quarter.start_month - 1]} - ${
        monthNames[quarter.end_month - 1]
      }`;
    } else {
      return `${monthNames[quarter.start_month - 1]} - ${
        monthNames[quarter.end_month - 1]
      } (next year)`;
    }
  };

  const getQuarterDateRange = (quarter: Quarter, year: number) => {
    const startDate = new Date(year, quarter.start_month - 1, 1);

    let endYear = year;
    if (quarter.start_month > quarter.end_month) {
      // Cross-year quarter - end month is in the next year
      endYear = year + 1;
    }

    const endDate = new Date(endYear, quarter.end_month, 0); // Last day of the month

    return { startDate, endDate };
  };

  return {
    quarters,
    loading,
    error,
    fetchQuarters,
    getQuarterByNumber,
    getQuarterForDate,
    getCurrentQuarter,
    getQuarterMonthNames,
    getQuarterDateRange,
  };
};
