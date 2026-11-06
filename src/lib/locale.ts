export const TIMEZONE = "Asia/Dhaka";
export type Lang = "bn" | "en";

export function formatBDT(amount: number, lang: Lang = "bn") {
  const n = new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-BD", { maximumFractionDigits: 0 }).format(amount);
  return `৳${n}`;
}

export function formatDhaka(date: Date, lang: Lang = "bn", opts: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }) {
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", { timeZone: TIMEZONE, ...opts }).format(date);
}

export function formatNumber(n: number, lang: Lang = "bn") {
  return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-BD").format(n);
}

/** Current date ("YYYY-MM-DD") and time ("HH:mm") on the Dhaka clock. */
export function dhakaNowParts(now: Date = new Date()) {
  const d = new Date(now.getTime() + 6 * 3600_000);
  const iso = d.toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

/** Converts a Dhaka-local date + time (UTC+6, no DST) to a UTC ISO string. */
export function dhakaToISO(date: string, time: string) {
  return new Date(`${date}T${time}:00+06:00`).toISOString();
}
