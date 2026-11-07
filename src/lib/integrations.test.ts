import { describe, it, expect } from "vitest";
import { withDefaults, integrationUrlError, joinUrl } from "./integrations";
describe("integrations", () => {
  it("falls back to Jitsi when nothing saved", () => expect(withDefaults(null).jitsi_base).toBe("https://meet.jit.si"));
  it("uses saved video address", () => expect(withDefaults({ jitsi_base: "https://meet.example.com" }).jitsi_base).toBe("https://meet.example.com"));
  it("rejects non-https addresses", () => { expect(integrationUrlError("http://x.com")).toBe(true); expect(integrationUrlError("https://x.com")).toBe(false); });
  it("joins without double slash", () => expect(joinUrl("https://meet.jit.si/", "DiabeCare-1")).toBe("https://meet.jit.si/DiabeCare-1"));
});
