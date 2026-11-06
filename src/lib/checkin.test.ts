import { describe, expect, it } from "vitest";
import { checkinSms, currentSlot } from "./checkin";

describe("check-in SMS", () => {
  it("matches the requested wording", () => {
    expect(checkinSms("রহিম", "lunch", "https://x.y/c/1")).toBe("আসসালামু আলাইকুম রহিম সাহেব, দুপুরের খাবার খেয়েছেন? সুগার কত? এই লিংকে লিখে দিন: https://x.y/c/1");
  });
  it("picks the meal by Dhaka time", () => {
    expect(currentSlot(new Date("2026-11-06T02:00:00Z"))).toBe("morning"); // 8am Dhaka
    expect(currentSlot(new Date("2026-11-06T07:00:00Z"))).toBe("lunch"); // 1pm
    expect(currentSlot(new Date("2026-11-06T14:00:00Z"))).toBe("dinner"); // 8pm
  });
});
