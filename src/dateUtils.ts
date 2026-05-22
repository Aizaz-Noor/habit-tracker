/**
 * Date utility helpers for the Habit Tracker.
 * All week calculations use Monday as the first day.
 */

/** Format a Date to YYYY-MM-DD string used as completion keys. */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today's date string. */
export function todayString(): string {
  return toDateString(new Date());
}

/**
 * Given any date, return the Monday of that week.
 * JavaScript getDay(): 0=Sunday, 1=Monday ... 6=Saturday
 */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  // Distance from Monday: if Sunday (0) go back 6 days, otherwise day-1
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Return an array of 7 Date objects (Mon–Sun) for the week
 * that contains the given date.
 */
export function getWeekDays(date: Date): Date[] {
  const monday = getMonday(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** Add `weeks` weeks to a date (negative = past weeks). */
export function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

/** Human-readable week label, e.g. "22 May – 28 May 2026" */
export function weekLabel(weekDays: Date[]): string {
  const first = weekDays[0];
  const last = weekDays[6];
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const firstStr = first.toLocaleDateString('en-GB', opts);
  const lastStr = last.toLocaleDateString('en-GB', { ...opts, year: 'numeric' });
  return `${firstStr} – ${lastStr}`;
}

/** Short day header label, e.g. "Mon 22" */
export function dayHeader(date: Date): { abbr: string; num: string } {
  const abbr = date.toLocaleDateString('en-GB', { weekday: 'short' });
  const num = String(date.getDate());
  return { abbr, num };
}

/**
 * Calculate the current streak for a habit.
 *
 * Strategy:
 * - If today is marked complete, count consecutive completed days ending today.
 * - If today is NOT complete, count consecutive completed days ending yesterday.
 * - Count backwards until a day is not completed.
 */
export function calcStreak(completions: Record<string, boolean>): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = toDateString(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Start from today if done, otherwise from yesterday
  const startDate = completions[todayStr] ? today : yesterday;

  let streak = 0;
  const current = new Date(startDate);

  // Walk backwards while the day is marked complete
  while (true) {
    const key = toDateString(current);
    if (completions[key]) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
