// lib/utils/classDay.ts
// AHIC meets weekly. All "which day" logic should go through here so it is
// correct in UK time (toISOString() is UTC and drifts around midnight in BST).

export const CLASS_WEEKDAY = 2; // 0 = Sunday … 2 = Tuesday

/** Today's date in Europe/London as YYYY-MM-DD */
export function todayInLondon(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Most recent class day on or before today (UK time), as YYYY-MM-DD */
export function latestClassDay(
  weekday: number = CLASS_WEEKDAY,
  now: Date = new Date(),
): string {
  const [y, m, d] = todayInLondon(now).split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const diff = (date.getUTCDay() - weekday + 7) % 7;
  date.setUTCDate(date.getUTCDate() - diff);
  return date.toISOString().slice(0, 10);
}
