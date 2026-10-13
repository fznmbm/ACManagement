// lib/utils/prayerParticipation.ts
//
// Shared "weeks submitted / expected weeks" maths for prayer-sheet compliance.
// There is no stored "prayer enabled on" date, so the tracking window is
// inferred from the sheets themselves, and each child's expected start is
// clamped to their enrolment week — so a late-enrolled child is only measured
// from the week they joined, never penalised for weeks before.

export function mondayOf(dateStr: string | Date): Date {
  const d = typeof dateStr === "string" ? new Date(dateStr) : new Date(dateStr);
  if (isNaN(d.getTime())) return new Date(NaN);
  const day = d.getDay(); // 0 = Sun … 6 = Sat
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function weeksBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / WEEK_MS);
}

/**
 * Cohort window = earliest → latest week_start_date across the sheets in scope,
 * with the end clamped to this week's Monday so one future-dated sheet can't
 * inflate everyone's denominator.
 */
export function cohortWindow(
  weekStartDates: (string | null | undefined)[],
): { start: Date | null; end: Date | null } {
  const mondays = weekStartDates
    .filter((w): w is string => !!w)
    .map((w) => mondayOf(w))
    .filter((d) => !isNaN(d.getTime()));
  if (mondays.length === 0) return { start: null, end: null };
  const start = new Date(Math.min(...mondays.map((d) => d.getTime())));
  const observedEnd = new Date(Math.max(...mondays.map((d) => d.getTime())));
  const thisMonday = mondayOf(new Date());
  const end = new Date(
    Math.min(observedEnd.getTime(), thisMonday.getTime()),
  );
  return { start, end };
}

/**
 * Expected weeks for a single child, inclusive of both end weeks.
 * Returns 0 when the window is unknown or the child enrolled after it (→ "—").
 */
export function expectedWeeks(
  window: { start: Date | null; end: Date | null },
  enrolmentDate: string | null | undefined,
): number {
  const { start, end } = window;
  if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }
  let childStart = start;
  if (enrolmentDate) {
    const enrolMonday = mondayOf(enrolmentDate);
    if (!isNaN(enrolMonday.getTime()) && enrolMonday.getTime() > start.getTime()) {
      childStart = enrolMonday;
    }
  }
  if (childStart.getTime() > end.getTime()) return 0; // enrolled after the window
  return weeksBetween(childStart, end) + 1;
}

/** submitted / expected as a 0–100 %, capped at 100. null expected → null. */
export function participationRate(
  submitted: number,
  expected: number,
): number | null {
  if (expected <= 0) return null;
  return Math.min(100, Math.round((submitted / expected) * 100));
}
