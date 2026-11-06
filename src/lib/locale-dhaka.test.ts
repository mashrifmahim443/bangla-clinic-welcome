import { describe, it, expect } from "vitest";
import { dhakaNowParts, dhakaToISO } from "./locale";
describe("Dhaka reading time", () => {
  it("converts Dhaka 08:30 to 02:30 UTC", () => {
    expect(dhakaToISO("2026-11-06", "08:30")).toBe("2026-11-06T02:30:00.000Z");
  });
  it("uses the Dhaka date after 18:00 UTC", () => {
    expect(dhakaNowParts(new Date("2026-11-06T19:00:00Z"))).toEqual({ date: "2026-11-07", time: "01:00" });
  });
});
