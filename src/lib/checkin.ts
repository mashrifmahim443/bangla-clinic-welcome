export type Slot = "morning" | "lunch" | "dinner";
const meal: Record<Slot, string> = { morning: "সকালের নাশতা", lunch: "দুপুরের খাবার", dinner: "রাতের খাবার" };
export const mealLabel = meal;

/** Warm, short Bangla SMS / WhatsApp text for a check-in link. */
export function checkinSms(name: string, slot: Slot, link: string, gender: "m" | "f" = "m") {
  const n = name.trim();
  const greet = n ? `আসসালামু আলাইকুম ${n} ${gender === "f" ? "আপা" : "সাহেব"},` : "আসসালামু আলাইকুম,";
  return `${greet} ${meal[slot]} খেয়েছেন? সুগার কত? এই লিংকে লিখে দিন: ${link}`;
}

export function currentSlot(now: Date): Slot {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", hour: "numeric", hour12: false }).format(now));
  return h < 11 ? "morning" : h < 17 ? "lunch" : "dinner";
}
