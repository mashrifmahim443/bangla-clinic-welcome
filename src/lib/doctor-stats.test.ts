import { describe, it, expect } from "vitest";
import { doctorStats } from "./doctor-stats";
const a = (status: string, p = "x") => ({ status, slot_start: "2026-11-01T10:00:00Z", patient_id: p });
describe("doctorStats", () => {
  it("cancel rate is cancelled out of all bookings", () => {
    expect(doctorStats([a("cancelled"), a("completed"), a("pending"), a("confirmed")]).cancelRate).toBe(25);
  });
  it("success rate is completed out of finished appointments", () => {
    expect(doctorStats([a("completed"), a("completed"), a("cancelled"), a("no_show"), a("pending")]).successRate).toBe(50);
  });
  it("empty list gives zero", () => { expect(doctorStats([]).successRate).toBe(0); });
});
