import { describe, expect, it } from "vitest";
import { popupMatchesRole, unreadPopups } from "./popup-messages";

describe("admin popup recipients", () => {
  it("shows doctor-only messages only in the doctor portal", () => {
    expect(popupMatchesRole("doctor", "doctor")).toBe(true);
    expect(popupMatchesRole("doctor", "patient")).toBe(false);
  });
  it("shows patient-only messages only in the patient portal", () => {
    expect(popupMatchesRole("patient", "patient")).toBe(true);
    expect(popupMatchesRole("patient", "doctor")).toBe(false);
  });
  it("shows both-audience messages to doctors and patients, not admins", () => {
    expect(popupMatchesRole("both", "doctor")).toBe(true);
    expect(popupMatchesRole("both", "patient")).toBe(true);
    expect(popupMatchesRole("both", "admin")).toBe(false);
  });
  it("does not show disabled or previously dismissed messages", () => {
    const messages = [
      { id: "read", active: true, audience: "both" as const },
      { id: "off", active: false, audience: "both" as const },
      { id: "new", active: true, audience: "patient" as const },
    ];
    expect(unreadPopups(messages, ["read"], "patient").map(m => m.id)).toEqual(["new"]);
  });
});