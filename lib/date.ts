const BUSINESS_TIMEZONE = "America/Sao_Paulo";
const BUSINESS_UTC_OFFSET = "-03:00";

/**
 * Bounds for a business day, anchored to a fixed -03:00 offset instead of the
 * server process's local timezone. `new Date(dateStr)` alone parses as UTC
 * midnight, so mixing it with `Date#setHours` (which mutates using the
 * process's local timezone) produces boundaries that silently shift by the
 * server/local offset — correct in some environments, wrong in others.
 */
export function businessDayBounds(dateStr: string): { start: Date; end: Date } {
  return {
    start: new Date(`${dateStr}T00:00:00.000${BUSINESS_UTC_OFFSET}`),
    end: new Date(`${dateStr}T23:59:59.999${BUSINESS_UTC_OFFSET}`),
  };
}

/** "Today" as a yyyy-mm-dd string in the business timezone, regardless of server process TZ. */
export function todayInBusinessTimezone(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

/** yyyy-mm-dd string for `daysAgo` days before `dateStr` (calendar arithmetic, no timezone reinterpretation). */
export function shiftDateStr(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return shifted.toISOString().slice(0, 10);
}
