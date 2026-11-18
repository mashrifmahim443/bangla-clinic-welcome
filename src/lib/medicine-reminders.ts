import { formatDhaka } from "./locale";

export const REMINDER_MINUTES = 15;
export function validReminderMinutes(minutes: number) {
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= 1440;
}
export function validDoseTimes(times: string[]) {
  return times.length >= 1 && times.length <= 6 && new Set(times).size === times.length && times.every(time => /^([01]\d|2[0-3]):[0-5]\d$/.test(time));
}
export function reminderMessage(medicine: string, dose: string, timing: string, doseAt: string) {
  return `ডায়াকেয়ার: ${formatDhaka(new Date(doseAt), "bn", { hour: "numeric", minute: "2-digit" })}-এ ${medicine} (${dose}) খাওয়ার সময়।${timing ? ` ${timing}।` : ""} ডাক্তারের নির্দেশ মেনে ওষুধ খাবেন।`;
}