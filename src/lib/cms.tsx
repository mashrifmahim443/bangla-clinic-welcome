import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import type { Json } from "@/integrations/supabase/types";

export type FieldKind = "text" | "long" | "lines" | "image";
export type Field = { key: string; section: string; label: [string, string]; kind: FieldKind; bn: string; en: string; hint?: [string, string] };

export const sections: Record<string, [string, string]> = {
  hero: ["প্রথম অংশ", "Hero"],
  strip: ["সংখ্যার সারি", "Numbers strip"],
  how: ["কীভাবে কাজ করে", "How it works"],
  doctors: ["ডাক্তার অংশ", "Doctors section"],
  food: ["খাবার অংশ", "Food section"],
  pricing: ["ফি", "Pricing"],
  faq: ["সাধারণ প্রশ্ন", "FAQ"],
  footer: ["ফুটার ও যোগাযোগ", "Footer & contact"],
};

const PAIR: [string, string] = ["প্রতি লাইনে একটা, বাম পাশ | ডান পাশ", "One per line, left | right"];
const LINE: [string, string] = ["প্রতি লাইনে একটা", "One per line"];

export const fields: Field[] = [
  { key: "hero.line1", section: "hero", kind: "text", label: ["শিরোনাম, প্রথম লাইন", "Headline, line 1"], bn: "সুগারের হিসাব রাখুন।", en: "Keep track of your sugar." },
  { key: "hero.l2_before", section: "hero", kind: "text", label: ["দ্বিতীয় লাইন, দাগের আগে", "Line 2, before underline"], bn: "", en: "Tell your " },
  { key: "hero.l2_word", section: "hero", kind: "text", label: ["দাগ দেওয়া শব্দ", "Underlined word"], bn: "ডাক্তারকে", en: "doctor" },
  { key: "hero.l2_after", section: "hero", kind: "text", label: ["দ্বিতীয় লাইন, দাগের পরে", "Line 2, after underline"], bn: " জানান।", en: "." },
  { key: "hero.sub", section: "hero", kind: "long", label: ["নিচের লেখা", "Sub text"], bn: "দিনে তিনবার রিডিং লিখুন। আপনার ডাক্তার সেটা দেখে বাংলায় পরামর্শ দেবেন।", en: "Write down your reading three times a day. Your doctor reads it and replies in plain words." },
  { key: "hero.cta", section: "hero", kind: "text", label: ["সবুজ বোতাম", "Green button"], bn: "ডাক্তার দেখান", en: "See a doctor" },
  { key: "hero.image", section: "hero", kind: "image", label: ["ছবি", "Photo"], bn: "", en: "" },
  { key: "hero.note_title", section: "hero", kind: "text", label: ["ছোট কার্ডের লেখা", "Note card title"], bn: "আজকের রিডিং", en: "today's reading" },
  { key: "hero.note_sub", section: "hero", kind: "text", label: ["কার্ডের নিচের লেখা", "Note card caption"], bn: "খালি পেটে, সকাল ৭:৩০", en: "fasting, 7:30 am" },
  { key: "strip.items", section: "strip", kind: "lines", hint: PAIR, label: ["তিনটা সংখ্যা", "Three numbers"], bn: "৩ বেলা | প্রতিদিন চেক-ইন\n৪০+ | BMDC যাচাইকৃত ডাক্তার\n১০০% | বাংলায় খাদ্য তালিকা", en: "3 times | daily check-in\n40+ | BMDC-verified doctors\n100% | food lists in Bangla" },
  { key: "how.title", section: "how", kind: "text", label: ["শিরোনাম", "Heading"], bn: "কীভাবে কাজ করে", en: "How it works" },
  { key: "how.steps", section: "how", kind: "lines", hint: PAIR, label: ["ধাপ (শিরোনাম | বিবরণ)", "Steps (title | detail)"], bn: "অ্যাকাউন্ট খুলুন | ফোন নম্বর বা ইমেইল দিয়ে, দুই মিনিটে।\nদিনে তিন বেলা সুগার লিখুন | সকালে খালি পেটে, দুপুরে আর রাতে খাওয়ার পরে।\nডাক্তার আপনার হিসাব দেখেন | সপ্তাহের রিডিং একটা পাতায়, সংখ্যা আর রঙে।\nভিডিও বা ফোনে পরামর্শ | ওষুধ আর খাবারের তালিকা বাংলায় পাবেন।", en: "Open an account | With your email, in two minutes.\nWrite your sugar three times a day | Fasting in the morning, after lunch and after dinner.\nYour doctor sees your log | The week's readings on one page, in numbers and colour.\nAdvice by video or phone | You get medicine and food lists in Bangla." },
  { key: "doctors.title", section: "doctors", kind: "text", label: ["শিরোনাম", "Heading"], bn: "আমাদের ডাক্তার", en: "Our doctors" },
  { key: "doctors.join_note", section: "doctors", kind: "long", label: ["যোগ দেওয়ার নিচের লেখা", "Join note"], bn: "BMDC নিবন্ধন নম্বর আর ডিগ্রি দিয়ে আবেদন করুন। আমরা যাচাই করি।", en: "Apply with your BMDC registration number and degrees. We verify each one." },
  { key: "food.title", section: "food", kind: "text", label: ["শিরোনাম", "Heading"], bn: "কী খাবেন, কী এড়াবেন", en: "What to eat, what to avoid" },
  { key: "food.sub", section: "food", kind: "text", label: ["নিচের লেখা", "Sub text"], bn: "ঘরের খাবার দিয়েই শুরু। পরিমাণটাই আসল।", en: "Start with home food. Portion is what matters." },
  { key: "food.eat", section: "food", kind: "lines", hint: LINE, label: ["খাবেন", "Eat"], bn: "লাল চালের ভাত, অল্প পরিমাণে\nমসুর ও মুগ ডাল\nলাল শাক, পুঁই শাক, কলমি শাক\nকরলা, ঢেঁড়স, লাউ\nরুই, ইলিশ, কাঁচকি মাছ\nপেয়ারা, আমড়া, জাম্বুরা", en: "Red rice, small portion\nMasoor and mung dal\nRed, malabar and water spinach\nBitter gourd, okra, bottle gourd\nRui, ilish, small fish\nGuava, hog plum, pomelo" },
  { key: "food.avoid", section: "food", kind: "lines", hint: LINE, label: ["এড়াবেন", "Avoid"], bn: "সাদা ভাত বেশি পরিমাণে\nরসগোল্লা, মিষ্টি, পায়েস\nপরোটা, লুচি, সিঙ্গারা\nচিনি দেওয়া চা\nপাকা আম, কাঁঠাল বেশি\nকোমল পানীয়", en: "Large plates of white rice\nRoshogolla, mishti, payesh\nParatha, luchi, shingara\nTea with sugar\nLots of ripe mango, jackfruit\nSoft drinks" },
  { key: "pricing.sub", section: "pricing", kind: "text", label: ["নিচের লেখা", "Sub text"], bn: "মাসিক, টাকায়। যেকোনো সময় বন্ধ করা যায়।", en: "Monthly, in taka. Stop any time." },
  { key: "pricing.prices", section: "pricing", kind: "text", label: ["দাম (বিনামূল্যে, মাসিক, পরিবার) কমা দিয়ে", "Prices (Free, Monthly, Family), comma separated"], bn: "0, 499, 1199", en: "0, 499, 1199" },
  { key: "faq.items", section: "faq", kind: "lines", hint: PAIR, label: ["প্রশ্ন | উত্তর", "Question | answer"], bn: "আমার গ্লুকোমিটার লাগবে? | হ্যাঁ। যেকোনো ব্র্যান্ডের গ্লুকোমিটার চলবে। রিডিং হাতে লিখে দিলেই হবে।\nডাক্তাররা কি সত্যিই BMDC নিবন্ধিত? | হ্যাঁ। আমরা প্রত্যেকের নিবন্ধন নম্বর যাচাই করি এবং তাদের পাতায় দেখাই।\nবিকাশ বা নগদে ফি দেওয়া যাবে? | হ্যাঁ, বিকাশ, নগদ আর কার্ড — তিনটাই চলবে।\nআমার বাবা-মায়ের হিসাব কি আমি রাখতে পারব? | পারবেন। পরিবার প্ল্যানে একটা অ্যাকাউন্টে চারজন পর্যন্ত রাখা যায়।\nসুগার খুব কমে গেলে কী করব? | ৩.৯ mmol/L-এর নিচে হলে সঙ্গে সঙ্গে চিনি বা গ্লুকোজ খান। জ্ঞান হারালে নিকটস্থ হাসপাতালে যান।", en: "Do I need a glucometer? | Yes. Any brand works. You type the reading in yourself.\nAre the doctors really BMDC registered? | Yes. We check each registration number and show it on their page.\nCan I pay with bKash or Nagad? | Yes — bKash, Nagad and card all work.\nCan I keep a log for my parents? | Yes. The family plan holds up to four people on one account.\nWhat if my sugar drops very low? | Below 3.9 mmol/L, take sugar or glucose right away. If someone faints, go to the nearest hospital." },
  { key: "footer.address", section: "footer", kind: "text", label: ["ঠিকানা", "Address"], bn: "বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা ১২০৫", en: "House 12, Road 5, Dhanmondi, Dhaka 1205" },
  { key: "footer.phone", section: "footer", kind: "text", label: ["ফোন", "Phone"], bn: "+880 1711-000000", en: "+880 1711-000000" },
  { key: "footer.hours", section: "footer", kind: "text", label: ["খোলার সময়", "Opening hours"], bn: "শনি–বৃহস্পতি, সকাল ৯টা – রাত ৯টা", en: "Sat–Thu, 9am – 9pm" },
  { key: "footer.bmdc", section: "footer", kind: "long", label: ["BMDC নোট", "BMDC note"], bn: "সব ডাক্তার BMDC নিবন্ধিত। নিবন্ধন নম্বর প্রত্যেক ডাক্তারের পাতায় দেওয়া আছে।", en: "Every doctor is BMDC registered. Registration numbers are on each doctor's page." },
  { key: "footer.emergency", section: "footer", kind: "long", label: ["জরুরি সতর্কতা", "Emergency notice"], bn: "জরুরি অবস্থায় এই প্ল্যাটফর্ম হাসপাতালের বিকল্প নয়।", en: "In an emergency, this platform is not a substitute for a hospital." },
];
export const fieldByKey = Object.fromEntries(fields.map((f) => [f.key, f]));

export type SiteRow = { key: string; data: Json };
export const siteContentQuery = {
  queryKey: ["site-content"] as const,
  queryFn: async (): Promise<Record<string, Json>> => {
    const { data, error } = await supabase.from("site_content").select("key, data");
    if (error) throw error;
    return Object.fromEntries((data ?? []).map((r) => [r.key, r.data]));
  },
  staleTime: 60_000,
};

export function useSiteContent() {
  return useQuery(siteContentQuery).data ?? {};
}

export function useCms() {
  const { lang } = useLang();
  const all = useSiteContent();
  const c = (key: string): string => {
    const f = fieldByKey[key];
    const o = all[key] as { bn?: string; en?: string; url?: string } | undefined;
    const v = o?.[lang];
    if (typeof v === "string" && v.trim() !== "") return v;
    return f ? f[lang] : key;
  };
  const lines = (key: string) => c(key).split("\n").map((l) => l.trim()).filter(Boolean).map((l) => l.split("|").map((s) => s.trim()));
  const img = (key: string, fallback: string) => {
    const o = all[key] as { url?: string } | undefined;
    return o?.url || fallback;
  };
  function json<T>(key: string, fallback: T): T {
    const v = all[key];
    return v == null ? fallback : (v as unknown as T);
  }
  return { c, lines, img, json };
}

export async function saveContent(key: string, data: unknown) {
  return supabase.from("site_content").upsert({ key, data: data as Json, updated_at: new Date().toISOString() });
}

/** Resize an image file to a JPEG data URL (stored directly, max ~1200px). */
export function fileToDataUrl(file: File, max = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement("canvas");
      cv.width = Math.round(img.width * s);
      cv.height = Math.round(img.height * s);
      cv.getContext("2d")!.drawImage(img, 0, 0, cv.width, cv.height);
      resolve(cv.toDataURL("image/jpeg", 0.82));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
