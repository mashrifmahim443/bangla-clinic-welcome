export function validSmsRecipient(value: string) {
  return /^(01\d{9}|8801\d{9})$/.test(value.trim());
}

export function smsProviderParameters(recipient: string, message: string, sender: string, key: string) {
  const text = message.trim();
  const unicode = /[^\x00-\x7F]/.test(text);
  const body = new URLSearchParams({ apikey: key, sender, msisdn: recipient.trim(), smstext: text });
  if (unicode) body.set("smsformat", "8");
  if (Array.from(text).length > (unicode ? 70 : 160)) body.set("type", "long");
  return body;
}

export function smsProviderStatus(payload: unknown): number | null {
  if (!payload || typeof payload !== "object" || !("response" in payload) || !Array.isArray(payload.response)) return null;
  const first: unknown = payload.response[0];
  if (!first || typeof first !== "object" || !("status" in first)) return null;
  const status = first.status;
  if (typeof status === "number" && Number.isInteger(status)) return status;
  return typeof status === "string" && /^\d+$/.test(status) ? Number(status) : null;
}