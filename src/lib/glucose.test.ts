import { describe, it, expect } from "vitest";
import { glucoseState, statusSentence, countToday } from "./glucose";

describe("glucose rules", () => {
  it("below 70 is low, above 180 is high", () => {
    expect(glucoseState(69)).toBe("low");
    expect(glucoseState(70)).toBe("ok");
    expect(glucoseState(180)).toBe("ok");
    expect(glucoseState(181)).toBe("high");
  });
  it("status says two readings missing after one check", () => {
    expect(statusSentence(1, "bn")).toBe("আজ এখনো দুবার সুগার লেখা হয়নি।");
  });
  it("counts today by Dhaka date, not UTC", () => {
    // 2026-11-06 19:00 UTC is already 7 Nov 01:00 in Dhaka
    const now = new Date("2026-11-06T19:00:00Z");
    expect(countToday([new Date("2026-11-06T17:00:00Z"), new Date("2026-11-06T19:30:00Z")], now)).toBe(1);
  });
});
