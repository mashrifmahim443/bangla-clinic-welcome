import { describe, it, expect } from "vitest";
import { upcomingDays } from "./slots";

describe("booking slots", () => {
  const now = new Date("2026-11-05T00:00:00Z"); // Thu 6:00 Dhaka
  const days = upcomingDays(now);
  it("skips Friday", () => {
    expect(days.map((d) => d.key)).not.toContain("2026-11-06");
  });
  it("first slot is 10:00 Dhaka, 12 half-hour slots a day", () => {
    expect(days[0]!.slots[0]!.toISOString()).toBe("2026-11-05T04:00:00.000Z");
    expect(days[0]!.slots).toHaveLength(12);
  });
});
