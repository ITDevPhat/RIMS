function pad(value: number) {
  return String(value).padStart(2, "0");
}

export type DatePrecision = "DAY" | "MONTH";

export function normalizeDatePrecision(value?: string | null): DatePrecision {
  return value === "MONTH" ? "MONTH" : "DAY";
}

export function parseDateValue(value?: string | Date | null) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) return date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateVN(value?: string | Date | null) {
  const date = parseDateValue(value);
  if (!date) return typeof value === "string" && value ? value : "—";
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatMonthVN(value?: string | Date | null) {
  const date = parseDateValue(value);
  if (!date) return typeof value === "string" && value ? value : "—";
  return `${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatDateByPrecision(value?: string | Date | null, precision?: string | null) {
  return normalizeDatePrecision(precision) === "MONTH" ? formatMonthVN(value) : formatDateVN(value);
}

export function normalizeDateValueByPrecision(value: string, precision?: string | null) {
  const date = parseDateValue(value);
  if (!date) return "";
  return normalizeDatePrecision(precision) === "MONTH"
    ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-01`
    : `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDateTimeVN(value?: string | Date | null) {
  const date = parseDateValue(value);
  if (!date) return typeof value === "string" && value ? value : "—";
  return `${formatDateVN(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
