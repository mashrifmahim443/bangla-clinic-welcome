import { TIMEZONE, type Lang } from "./locale";

/** Sugar is shown in mmol/L everywhere (mmol/L = mg/dL ÷ 18.016). */
export const UNIT = "mmol/L";
export const RANGE_LOW = 3.9;
export const RANGE_HIGH = 10;
/** What the form and the database accept. */
export const MIN_VALUE = 1.1;
export const MAX_VALUE = 33.3;
export const DAILY_CHECKS = 3;

export type GlucoseState = "low" | "ok" | "high";
export function glucoseState(v: number): GlucoseState {
  if (v < RANGE_LOW) return "low";
  if (v > RANGE_HIGH) return "high";
  return "ok";
}

/** mg/dL -> mmol/L with one decimal. Only for converting older numbers. */
export function mgDlToMmol(v: number) {
  return Math.round((v / 18.016) * 10) / 10;
}

/** mmol/L with one decimal, in the reader's own digits. */
export function formatGlucose(v: number, lang: Lang = "bn") {
  return new Intl.NumberFormat(lang === "bn" ? "bn-BD" : "en-BD", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(v);
}

/** Accepts Bangla or English digits and a dot or comma: "৬,২" -> 6.2. */
export function parseGlucose(s: string): number {
  const ascii = s.trim().replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).replace(",", ".");
  const n = Number(ascii);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : NaN;
}

/** YYYY-MM-DD of a moment in Dhaka. */
export function dhakaDay(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function countToday(dates: Date[], now = new Date()) {
  const today = dhakaDay(now);
  return dates.filter((d) => dhakaDay(d) === today).length;
}

/** Bilingual labels for how a reading relates to a meal. */
export const readingTypeLabels: Record<string, [string, string]> = {
  fasting: ["খালি পেটে", "Fasting"],
  before_meal: ["খাওয়ার আগে", "Before meal"],
  after_meal: ["খাওয়ার ২ ঘণ্টা পরে", "2h after meal"],
  bedtime: ["ঘুমানোর আগে", "Bedtime"],
  random: ["যেকোনো সময়", "Random"],
};
export const mealSlotLabels: Record<string, [string, string]> = {
  breakfast: ["সকাল", "Breakfast"],
  lunch: ["দুপুর", "Lunch"],
  dinner: ["রাত", "Dinner"],
};

/** e.g. "সকাল · খাওয়ার আগে" — falls back to just the type when no meal is stored. */
export function readingLabel(readingType: string | null, mealSlot: string | null, lang: Lang): string {
  const type = readingType ? readingTypeLabels[readingType] : undefined;
  const meal = mealSlot ? mealSlotLabels[mealSlot] : undefined;
  const typeText = type ? type[lang === "bn" ? 0 : 1] : "—";
  return meal ? `${meal[lang === "bn" ? 0 : 1]} · ${typeText}` : typeText;
}

/** Average mmol/L of readings taken in the last `days` days (Dhaka time), or null when empty. */
export function averageGlucose(readings: { value_mmol: number | null; taken_at: string }[], days: number, now = new Date()): number | null {
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  const values = readings.filter((r) => r.value_mmol !== null && new Date(r.taken_at).getTime() >= cutoff).map((r) => r.value_mmol as number);
  if (!values.length) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

const bnTimes = ["", "একবার", "দুবার", "তিনবার"];
export function statusSentence(countTodayN: number, lang: "bn" | "en") {
  const missing = Math.max(0, DAILY_CHECKS - countTodayN);
  if (missing === 0)
    return lang === "bn" ? "আজকের তিন বেলার সুগার লেখা হয়ে গেছে।" : "All three of today's readings are written down.";
  if (lang === "bn") return `আজ এখনো ${bnTimes[missing]} সুগার লেখা হয়নি।`;
  return `${missing === 1 ? "One reading" : missing === 2 ? "Two readings" : "Three readings"} still to write today.`;
}
