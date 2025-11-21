"use client";

import { useState } from "react";
import StudentFeeAssignment from "@/components/fees/StudentFeeAssignment";

interface StudentProfileClientProps {
  studentId: string;
}

export default function StudentProfileClient({
  studentId,
}: StudentProfileClientProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUpdate = () => {
    setRefreshKey((prev) => prev + 1);
    // Could also trigger a router.refresh() here if needed
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Fee Information</h3>
      <StudentFeeAssignment studentId={studentId} onUpdate={handleUpdate} />
    </div>
  );
}
