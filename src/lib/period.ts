import { format, startOfMonth, endOfMonth } from "date-fns";

/**
 * Parse period from URL search params.
 * Returns a DateRange for use in server components.
 */
export function parsePeriodFromParams(searchParams: {
  month?: string;
  start?: string;
  end?: string;
}): { start: Date; end: Date } {
  if (searchParams.start && searchParams.end) {
    return {
      start: new Date(searchParams.start),
      end: new Date(searchParams.end),
    };
  }

  const monthStr = searchParams.month || format(new Date(), "yyyy-MM");
  const [year, month] = monthStr.split("-").map(Number);
  const date = new Date(year, month - 1);
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}
