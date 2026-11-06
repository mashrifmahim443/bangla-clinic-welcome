import { describe, expect, it } from "vitest";
import { MIN_COMPLETION, profileCompletion } from "./profile";

describe("profile completion gate", () => {
  it("requires at least 60%", () => expect(MIN_COMPLETION).toBe(60));
  it("counts each of 10 fields as 10%", () => {
    expect(profileCompletion({ full_name: "Rahim", phone: "01711000000", address: "Mirpur", birth_year: 1965, gender: "m" })).toBe(50);
    expect(profileCompletion({ full_name: "Rahim", phone: "01711000000", address: "Mirpur", birth_year: 1965, gender: "m", medicines: "Metformin" })).toBe(60);
  });
  it("ignores blank text", () => expect(profileCompletion({ full_name: "  ", address: "" })).toBe(0));
});
