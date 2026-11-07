import { describe, expect, it } from "vitest";
import { REMINDER_MINUTES, validDoseTimes } from "./medicine-reminders";
describe("medicine reminders", () => {
  it("reminds before every dose", () => expect(REMINDER_MINUTES).toBe(15));
  it("accepts separate morning and evening doses", () => expect(validDoseTimes(["08:00", "20:00"])).toBe(true));
  it("rejects duplicate doses", () => expect(validDoseTimes(["08:00", "08:00"])).toBe(false));
  it("rejects invalid clock times", () => expect(validDoseTimes(["24:00"])).toBe(false));
});