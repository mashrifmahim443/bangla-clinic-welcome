import { formatDhaka } from "./locale";
import { validSmsRecipient } from "./sms-send";

export function doctorSmsPhone(phone: string | null | undefined) {
  const normalized = (phone ?? "").trim().replace(/[\s()-]/g, "").replace(/^\+/, "");
  return validSmsRecipient(normalized) ? normalized : null;
}

export function appointmentSmsMessage(slot: string, language: "bn" | "en" = "bn") {
  const time = formatDhaka(new Date(slot), language);
  return language === "bn"
    ? `DiabeCare: আপনার কাছে নতুন অ্যাপয়েন্টমেন্টের অনুরোধ এসেছে। সময়: ${time}। ডাক্তার পোর্টালে ঢুকে অনুরোধটি দেখুন।`
    : `DiabeCare: You have a new appointment request for ${time}. Open the doctor portal to review it.`;
}