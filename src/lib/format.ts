const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function money(cents: number) {
  return usd.format(cents / 100);
}

/** Parses "500", "$500.00", "1,250.5" into integer cents. Returns null if invalid. */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [dollars, cents = ""] = cleaned.split(".");
  return Number(dollars) * 100 + Number(cents.padEnd(2, "0"));
}

const TZ = "America/Los_Angeles";

export function formatDate(value: string | Date) {
  // Plain dates (YYYY-MM-DD) have no time zone; don't let them shift a day.
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { dateStyle: "medium" });
  }
  return new Date(value).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: TZ });
}

export function todayISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

export function invoiceNumber(season: string, number: number) {
  return `${season}-${String(number).padStart(4, "0")}`;
}

export const METHOD_LABELS: Record<string, string> = {
  check: "Check",
  zelle: "Zelle",
  cash: "Cash",
  other: "Other",
};

export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};
