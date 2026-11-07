import { describe, expect, it } from "vitest";
import { defaultSmsSettings, smsSettingsPayload } from "./sms-settings";

describe("SMS settings storage", () => {
  it("saves the user's confirmed sender ID", () => {
    expect(smsSettingsPayload(defaultSmsSettings).sender_id).toBe("8809617641360");
  });
  it("excludes credentials even if injected into form data", () => {
    const data = { ...defaultSmsSettings, apikey: "test-only-private-value" };
    expect(smsSettingsPayload(data)).not.toHaveProperty("apikey");
    expect(Object.keys(smsSettingsPayload(data)).sort()).toEqual(["id", "message_template", "sender_id", "test_number"]);
  });
});