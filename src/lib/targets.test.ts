import { describe, expect, it } from "vitest";
import { TARGETS, checkinRate, completionRate } from "./targets";

const now = Date.parse("2026-11-06T12:00:00Z");
describe("six-month targets", () => {
  it("uses the brief's numbers", () => {
    expect(TARGETS).toEqual({ doctors: 50, patients: 2000, conversion: 15, checkinRate: 60, completionRate: 85 });
  });
  it("completion counts only past, non-cancelled appointments", () => {
    expect(completionRate([
      { slot_start: "2026-11-01T04:00:00Z", status: "completed" },
      { slot_start: "2026-11-02T04:00:00Z", status: "booked" },
      { slot_start: "2026-11-03T04:00:00Z", status: "cancelled" },
      { slot_start: "2026-11-09T04:00:00Z", status: "booked" },
    ], now)).toBe(50);
  });
  it("check-in rate ignores links still open", () => {
    expect(checkinRate([
      { used_at: "2026-11-06T05:00:00Z", expires_at: "2026-11-06T10:00:00Z" },
      { used_at: null, expires_at: "2026-11-06T10:00:00Z" },
      { used_at: null, expires_at: "2026-11-06T20:00:00Z" },
    ], now)).toBe(50);
  });
});
