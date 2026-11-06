import { TIMEZONE } from "./locale";

export const RANGE_LOW = 70;
export const RANGE_HIGH = 180;
export const DAILY_CHECKS = 3;

export type GlucoseState = "low" | "ok" | "high";
export function glucoseState(v: number): GlucoseState {
  if (v < RANGE_LOW) return "low";
  if (v > RANGE_HIGH) return "high";
  return "ok";
}

/** YYYY-MM-DD of a moment in Dhaka. */
export function dhakaDay(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function countToday(dates: Date[], now = new Date()) {
  const today = dhakaDay(now);
  return dates.filter((d) => dhakaDay(d) === today).length;
}

const bnTimes = ["", "একবার", "দুবার", "তিনবার"];
export function statusSentence(countTodayN: number, lang: "bn" | "en") {
  const missing = Math.max(0, DAILY_CHECKS - countTodayN);
  if (missing === 0)
    return lang === "bn" ? "আজকের তিন বেলার সুগার লেখা হয়ে গেছে।" : "All three of today's readings are written down.";
  if (lang === "bn") return `আজ এখনো ${bnTimes[missing]} সুগার লেখা হয়নি।`;
  return `${missing === 1 ? "One reading" : missing === 2 ? "Two readings" : "Three readings"} still to write today.`;
}
