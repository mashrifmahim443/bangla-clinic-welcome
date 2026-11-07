import { describe, expect, it } from "vitest";
import { canTransition, refundEligibility } from "./appointments";
describe("appointment cancellation policy", () => {
  it("qualifies at exactly 24 hours", () => expect(refundEligibility("2026-11-08T10:00:00Z", "2026-11-07T10:00:00Z")).toBe("eligible"));
  it("requires admin review below 24 hours", () => expect(refundEligibility("2026-11-08T10:00:00Z", "2026-11-07T10:00:01Z")).toBe("admin_review"));
});
describe("appointment permissions", () => {
  it("patients cannot confirm", () => expect(canTransition("pending", "confirmed", "patient", false)).toBe(false));
  it("patients can cancel a pending request", () => expect(canTransition("pending", "cancelled", "patient", false)).toBe(true));
  it("doctor accepts pending requests", () => expect(canTransition("pending", "confirmed", "doctor", false)).toBe(true));
  it("cannot complete before start", () => expect(canTransition("confirmed", "completed", "doctor", false)).toBe(false));
  it("doctor marks started confirmed appointment complete", () => expect(canTransition("confirmed", "completed", "doctor", true)).toBe(true));
  it("closed appointments cannot change", () => expect(canTransition("cancelled", "confirmed", "doctor", true)).toBe(false));
});