import { describe, expect, it } from "vitest";
import { REMINDER_MINUTES, validDoseTimes, validReminderMinutes } from "./medicine-reminders";
describe("medicine reminders", () => {
  it("keeps the existing default", () => expect(REMINDER_MINUTES).toBe(15));
  it("allows custom reminder minutes", () => {
    for (const minutes of [1, 30, 60, 1440]) expect(validReminderMinutes(minutes)).toBe(true);
    for (const minutes of [0, -1, 1.5, 1441, NaN]) expect(validReminderMinutes(minutes)).toBe(false);
  });
  it("accepts separate morning and evening doses", () => expect(validDoseTimes(["08:00", "20:00"])).toBe(true));
  it("rejects duplicate doses", () => expect(validDoseTimes(["08:00", "08:00"])).toBe(false));
  it("rejects invalid clock times", () => expect(validDoseTimes(["24:00"])).toBe(false));
});