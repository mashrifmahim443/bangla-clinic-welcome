import { describe, it, expect } from "vitest";
import { normalizeVerificationPhone, verificationRequired } from "./phone-verification";
describe("new registration verification", () => {
  it("requires both email and phone for new users", () => {
    expect(verificationRequired(true, false, true)).toBe(true);
    expect(verificationRequired(true, true, false)).toBe(true);
    expect(verificationRequired(true, true, true)).toBe(false);
  });
  it("preserves existing users", () => expect(verificationRequired(false, false, false)).toBe(false));
  it("normalizes Bangladesh numbers consistently", () => {
    expect(normalizeVerificationPhone("+8801772258197")).toBe("01772258197");
    expect(normalizeVerificationPhone("০১৭৭২২৫৮১৯৭")).toBe("01772258197");
  });
});