/**
 * Kenya-specific formatting and phone helpers (KES, +254 MSISDN, Africa/Nairobi).
 */

export const KENYA_TIMEZONE = "Africa/Nairobi";

const kesFormatter = new Intl.NumberFormat("en-KE", {
  maximumFractionDigits: 2,
});

/** formatKES(125000) -> "KES 125,000" */
export function formatKES(amount: number): string {
  return `KES ${kesFormatter.format(amount ?? 0)}`;
}

/**
 * Normalise any Kenyan phone input to MSISDN form (2547XXXXXXXX / 2541XXXXXXXX).
 * Accepts "0712 345 678", "712345678", "+254712345678", "254712345678".
 * Returns null when the input is not a valid Kenyan mobile number.
 */
export function normalizeKenyanPhone(input: string): string | null {
  const digits = (input ?? "").replace(/[\s\-()+.]/g, "");
  let msisdn: string;

  if (digits.startsWith("254")) msisdn = digits;
  else if (digits.startsWith("0")) msisdn = `254${digits.slice(1)}`;
  else if (digits.length === 9) msisdn = `254${digits}`;
  else return null;

  return /^254[17]\d{8}$/.test(msisdn) ? msisdn : null;
}

export function isValidKenyanPhone(input: string): boolean {
  return normalizeKenyanPhone(input) !== null;
}

/** formatKenyanPhone("254712345678") -> "0712 345 678" */
export function formatKenyanPhone(msisdn: string): string {
  const normalized = normalizeKenyanPhone(msisdn);
  if (!normalized) return msisdn;
  const local = `0${normalized.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

/** Date formatted in Africa/Nairobi time, e.g. "15 Aug 2024". */
export function formatKENDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: KENYA_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Date + time formatted in Africa/Nairobi time, e.g. "15 Aug 2024, 14:00". */
export function formatKENDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: KENYA_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** Relative time in Nairobi time, e.g. "2 hours ago". */
export function formatRelativeKEN(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  const absSec = Math.round(Math.abs(diffMs) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en-KE", { numeric: "auto" });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, seconds] of units) {
    if (absSec >= seconds || unit === "second") {
      return rtf.format(Math.round(diffMs / seconds), unit);
    }
  }
  return formatKENDate(d);
}