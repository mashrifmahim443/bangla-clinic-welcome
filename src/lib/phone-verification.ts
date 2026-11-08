export function normalizeVerificationPhone(value: string) {
  const digits = value.replace(/[০-৯]/g, d => String("০১২৩৪৫৬৭৮৯".indexOf(d))).replace(/[\s+-]/g, "");
  return digits.startsWith("880") ? digits.slice(2) : digits;
}
export function verificationRequired(required: boolean, emailConfirmed: boolean, phoneVerified: boolean) {
  return required && (!emailConfirmed || !phoneVerified);
}