"use client";

import { useState } from "react";
import FeesTab from "./FeesTab";
import FinesTab from "./FinesTab";

interface Props {
  studentId: string;
}

export default function FinancesTab({ studentId }: Props) {
  const [activeSection, setActiveSection] = useState<"fees" | "fines">("fees");

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 bg-muted/30 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveSection("fees")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === "fees"
              ? "bg-card shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Fees & Invoices
        </button>
        <button
          onClick={() => setActiveSection("fines")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeSection === "fines"
              ? "bg-card shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Fines
        </button>
      </div>

      {activeSection === "fees" && <FeesTab studentId={studentId} />}
      {activeSection === "fines" && <FinesTab studentId={studentId} />}
    </div>
  );
}
