import { formatDhaka } from "./locale";
import { validSmsRecipient } from "./sms-send";

export function doctorSmsPhone(phone: string | null | undefined) {
  const normalized = (phone ?? "").trim().replace(/[\s()-]/g, "").replace(/^\+/, "");
  return validSmsRecipient(normalized) ? normalized : null;
}

/** Keeps patient-typed text to one safe line and a bounded length before it goes into an SMS. */
export function smsSafeText(value: string | null | undefined, limit: number) {
  const cleaned = (value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  const characters = Array.from(cleaned);
  return characters.length > limit ? `${characters.slice(0, limit).join("").trimEnd()}...` : cleaned;
}

export function appointmentSmsMessage(input: { slot: string; patientName?: string | null; reason?: string | null; language?: "bn" | "en" }) {
  const language = input.language ?? "bn";
  const time = formatDhaka(new Date(input.slot), language);
  const name = smsSafeText(input.patientName, 60) || (language === "bn" ? "নাম জানা নাই" : "not given");
  const problem = smsSafeText(input.reason, 160) || (language === "bn" ? "জানানো হয়নি" : "not given");
  return language === "bn"
    ? `DiabeCare: আপনার কাছে নতুন অ্যাপয়েন্টমেন্টের অনুরোধ এসেছে। রোগী: ${name}। সমস্যা: ${problem}। সময়: ${time}। ডাক্তার পোর্টালে ঢুকে অনুরোধটি দেখুন।`
    : `DiabeCare: New appointment request from ${name}. Problem: ${problem}. Time: ${time}. Open the doctor portal to review it.`;
}