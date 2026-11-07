import { describe, expect, it } from "vitest";
import { averageGlucose, readingLabel } from "@/lib/glucose";

const now = new Date("2026-11-07T06:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

describe("averageGlucose", () => {
  it("averages readings from the last 30 days with one decimal", () => {
    const readings = [
      { value_mmol: 6.0, taken_at: daysAgo(1) },
      { value_mmol: 8.2, taken_at: daysAgo(10) },
      { value_mmol: 10.0, taken_at: daysAgo(29) },
    ];
    expect(averageGlucose(readings, 30, now)).toBe(8.1);
  });

  it("ignores readings older than the window and null values", () => {
    const readings = [
      { value_mmol: 7.0, taken_at: daysAgo(5) },
      { value_mmol: 20.0, taken_at: daysAgo(31) },
      { value_mmol: null, taken_at: daysAgo(2) },
    ];
    expect(averageGlucose(readings, 30, now)).toBe(7.0);
  });

  it("returns null when there are no readings in the window", () => {
    expect(averageGlucose([{ value_mmol: 9.0, taken_at: daysAgo(40) }], 30, now)).toBeNull();
    expect(averageGlucose([], 30, now)).toBeNull();
  });
});

describe("readingLabel", () => {
  it("combines meal slot and timing in Bangla", () => {
    expect(readingLabel("before_meal", "breakfast", "bn")).toBe("সকাল · খাওয়ার আগে");
    expect(readingLabel("after_meal", "dinner", "en")).toBe("Dinner · 2h after meal");
  });

  it("falls back to the type only when no meal is stored", () => {
    expect(readingLabel("random", null, "bn")).toBe("যেকোনো সময়");
    expect(readingLabel(null, null, "bn")).toBe("—");
  });
});
