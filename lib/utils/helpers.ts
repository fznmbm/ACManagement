// lib/utils/helpers.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to readable string
 */
export function formatDate(
  date: string | Date,
  format: "short" | "long" = "short"
): string {
  const d = new Date(date);

  if (format === "long") {
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format time to readable string
 */
export function formatTime(time: string): string {
  if (!time) return "";

  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;

  return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Get attendance status color
 */
export function getAttendanceColor(status: string): string {
  const colors: Record<string, string> = {
    present: "text-green-600 bg-green-50",
    absent: "text-red-600 bg-red-50",
    late: "text-orange-600 bg-orange-50",
    excused: "text-blue-600 bg-blue-50",
    sick: "text-purple-600 bg-purple-50",
  };

  return colors[status] || "text-gray-600 bg-gray-50";
}

/**
 * Get attendance status badge classes
 */
export function getAttendanceBadge(status: string): string {
  const badges: Record<string, string> = {
    present: "badge-present",
    absent: "badge-absent",
    late: "badge-late",
    excused: "badge-excused",
  };

  return badges[status] || "bg-gray-100 text-gray-800";
}

/**
 * Calculate attendance percentage
 */
export function calculateAttendancePercentage(
  present: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100);
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncate text
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");

  // Format as UK number if applicable
  if (cleaned.startsWith("44")) {
    return `+44 ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
  }

  return phone;
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get current academic year
 */
export function getCurrentAcademicYear(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Academic year starts in September (month 8)
  if (month >= 8) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

/**
 * Sleep function for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
