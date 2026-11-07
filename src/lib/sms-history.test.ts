import { expect, it } from "vitest";
import { smsDeliveryState } from "./sms-history";

it("Automas code 0 means accepted, not delivered", () => {
  expect(smsDeliveryState(0)).toBe("accepted");
});
it("recipient confirmation is distinct from provider delivery", () => {
  expect(smsDeliveryState(0, true)).toBe("recipient_confirmed");
});
it("a missing provider reply never implies successful delivery", () => {
  expect(smsDeliveryState(null)).toBe("unknown");
});