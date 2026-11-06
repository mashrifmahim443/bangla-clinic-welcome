import { dhakaDay } from "./glucose";

/** Consultation hours in Dhaka time (no DST, UTC+6). Friday closed. */
export const SESSIONS: [number, number][] = [[10, 13], [17, 20]];
export const SLOT_MINUTES = 30;
const DHAKA_OFFSET_H = 6;

export type Day = { key: string; date: Date; slots: Date[] };

export function upcomingDays(now = new Date(), count = 7): Day[] {
  const days: Day[] = [];
  const [y, m, d] = dhakaDay(now).split("-").map(Number) as [number, number, number];
  for (let i = 0; days.length < count && i < 14; i++) {
    const noon = new Date(Date.UTC(y, m - 1, d + i, 12 - DHAKA_OFFSET_H));
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Dhaka", weekday: "short" }).format(noon);
    if (weekday === "Fri") continue;
    const slots: Date[] = [];
    for (const [start, end] of SESSIONS) {
      for (let min = start * 60; min < end * 60; min += SLOT_MINUTES) {
        const s = new Date(Date.UTC(y, m - 1, d + i, 0, min - DHAKA_OFFSET_H * 60));
        if (s.getTime() > now.getTime() + 30 * 60_000) slots.push(s);
      }
    }
    days.push({ key: dhakaDay(noon), date: noon, slots });
  }
  return days;
}
