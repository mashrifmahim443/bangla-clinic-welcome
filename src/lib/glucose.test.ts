import { describe, it, expect } from "vitest";
import { glucoseState, statusSentence, countToday, mgDlToMmol, formatGlucose, parseGlucose, UNIT, RANGE_LOW, RANGE_HIGH } from "./glucose";

describe("glucose rules", () => {
  it("unit is mmol/L", () => {
    expect(UNIT).toBe("mmol/L");
  });
  it("below 3.9 is low, above 10 is high", () => {
    expect(glucoseState(3.8)).toBe("low");
    expect(glucoseState(RANGE_LOW)).toBe("ok");
    expect(glucoseState(RANGE_HIGH)).toBe("ok");
    expect(glucoseState(10.1)).toBe("high");
  });
  it("converts mg/dL to mmol/L", () => {
    expect(mgDlToMmol(112)).toBe(6.2);
    expect(mgDlToMmol(70)).toBe(3.9);
    expect(mgDlToMmol(180)).toBe(10);
  });
  it("shows one decimal in the reader's digits", () => {
    expect(formatGlucose(6.2, "en")).toBe("6.2");
    expect(formatGlucose(6.2, "bn")).toBe("৬.২");
    expect(formatGlucose(10, "bn")).toBe("১০.০");
  });
  it("reads Bangla digits with a dot or a comma", () => {
    expect(parseGlucose("৬.২")).toBe(6.2);
    expect(parseGlucose("6,2")).toBe(6.2);
    expect(parseGlucose(" ১২০ ")).toBe(120);
    expect(Number.isNaN(parseGlucose("abc"))).toBe(true);
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
