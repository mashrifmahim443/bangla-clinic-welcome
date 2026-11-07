import { expect, it } from "vitest";
import { smsProviderParameters, smsProviderStatus, validSmsRecipient } from "./sms-send";

it("allows a single Bangladesh number, not a bulk list", () => {
  expect(validSmsRecipient("01772258197")).toBe(true);
  expect(validSmsRecipient("01772258197,01772258197")).toBe(false);
});
it("uses unicode SMS encoding for Bangla", () => {
  expect(smsProviderParameters("01772258197", "পরীক্ষার বার্তা", "sender", "test-key").get("smsformat")).toBe("8");
});
it("marks a Bangla SMS above 70 characters as long", () => {
  expect(smsProviderParameters("01772258197", "ক".repeat(71), "sender", "test-key").get("type")).toBe("long");
});
it("only exposes the documented numerical provider code", () => {
  expect(smsProviderStatus({ response: [{ status: 0, apikey: "never-expose" }] })).toBe(0);
  expect(smsProviderStatus({ error: "untrusted content" })).toBeNull();
});