import { describe, it, expect } from "vitest";
import { isChatOpen, latestByAppointment } from "./doctor-portal";
describe("doctor portal", () => {
  it("only accepted appointments open chat", () => { expect(isChatOpen("confirmed")).toBe(true); expect(isChatOpen("completed")).toBe(true); expect(isChatOpen("pending")).toBe(false); expect(isChatOpen("cancelled")).toBe(false); });
  it("keeps the newest message per conversation", () => {
    const m = latestByAppointment([{ appointment_id: "a", body: "old", created_at: "2026-01-01T00:00:00Z", sender_id: "x" }, { appointment_id: "a", body: "new", created_at: "2026-01-02T00:00:00Z", sender_id: "x" }]);
    expect(m.get("a")?.body).toBe("new");
  });
});
