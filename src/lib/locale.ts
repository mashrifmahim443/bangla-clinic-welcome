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
