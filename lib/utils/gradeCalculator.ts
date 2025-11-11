// lib/utils/gradeCalculator.ts

/**
 * Calculate letter grade from percentage score
 */
export function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 85) return "A";
  if (percentage >= 80) return "A-";
  if (percentage >= 75) return "B+";
  if (percentage >= 70) return "B";
  if (percentage >= 65) return "B-";
  if (percentage >= 60) return "C+";
  if (percentage >= 55) return "C";
  if (percentage >= 50) return "C-";
  return "F";
}

/**
 * Calculate percentage from score and max score
 */
export function calculatePercentage(score: number, maxScore: number): number {
  if (maxScore === 0) return 0;
  return Math.round((score / maxScore) * 100);
}

/**
 * Get grade color classes for Tailwind
 */
export function getGradeColor(grade: string): string {
  if (["A+", "A", "A-"].includes(grade)) {
    return "bg-green-100 text-green-800 border-green-200";
  }
  if (["B+", "B", "B-"].includes(grade)) {
    return "bg-blue-100 text-blue-800 border-blue-200";
  }
  if (["C+", "C", "C-"].includes(grade)) {
    return "bg-orange-100 text-orange-800 border-orange-200";
  }
  return "bg-red-100 text-red-800 border-red-200";
}

/**
 * Get grade description
 */
export function getGradeDescription(grade: string): string {
  const descriptions: Record<string, string> = {
    "A+": "Outstanding",
    A: "Excellent",
    "A-": "Very Good",
    "B+": "Good",
    B: "Above Average",
    "B-": "Satisfactory",
    "C+": "Fair",
    C: "Pass",
    "C-": "Marginal Pass",
    F: "Fail",
  };
  return descriptions[grade] || "Unknown";
}

/**
 * Get performance level from percentage
 */
export function getPerformanceLevel(percentage: number): {
  level: string;
  color: string;
  description: string;
} {
  if (percentage >= 85) {
    return {
      level: "Excellent",
      color: "text-green-700",
      description: "Outstanding performance",
    };
  }
  if (percentage >= 70) {
    return {
      level: "Good",
      color: "text-blue-700",
      description: "Above average performance",
    };
  }
  if (percentage >= 50) {
    return {
      level: "Satisfactory",
      color: "text-orange-700",
      description: "Meets basic requirements",
    };
  }
  return {
    level: "Needs Improvement",
    color: "text-red-700",
    description: "Requires additional support",
  };
}
