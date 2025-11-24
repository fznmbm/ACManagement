"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

interface AcademicYearSelectorProps {
  years: string[];
  selectedYear: string;
  currentYear: string;
}

export default function AcademicYearSelector({
  years,
  selectedYear,
  currentYear,
}: AcademicYearSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (year === currentYear) {
      // If switching to current year, remove the year param
      params.delete("year");
    } else {
      params.set("year", year);
    }

    router.push(`/applications?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>Academic Year:</span>
      </div>
      <select
        value={selectedYear}
        onChange={(e) => handleYearChange(e.target.value)}
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card font-medium"
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year} {year === currentYear && "(Current)"}
          </option>
        ))}
      </select>
    </div>
  );
}
