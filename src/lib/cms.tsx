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
  doctors: ["ডাক্তারদের অংশ", "Doctors section"],
  food: ["খাবারের অংশ", "Food section"],
  pricing: ["ফি", "Pricing"],
  faq: ["সাধারণ প্রশ্ন", "FAQ"],
  footer: ["ফুটার ও যোগাযোগ", "Footer & contact"],
  header: ["উপরের মেনু", "Top bar"],
  pages: ["অন্য পাতার শিরোনাম", "Other page headings"],
  subscription: ["প্ল্যানের পাতা", "Plans page"],
};

const PAIR: [string, string] = ["প্রতি লাইনে একটা, বাম পাশ | ডান পাশ", "One per line, left | right"];
const LINE: [string, string] = ["প্রতি লাইনে একটা", "One per line"];

export const fields: Field[] = [
  { key: "hero.line1", section: "hero", kind: "text", label: ["শিরোনাম, প্রথম লাইন", "Headline, line 1"], bn: "সুগারের হিসাব রাখুন।", en: "Keep track of your sugar." },
  { key: "hero.l2_before", section: "hero", kind: "text", label: ["দ্বিতীয় লাইন, দাগের আগে", "Line 2, before underline"], bn: "", en: "Tell your " },
  { key: "hero.l2_word", section: "hero", kind: "text", label: ["দাগ দেওয়া শব্দ", "Underlined word"], bn: "ডাক্তারকে", en: "doctor" },
  { key: "hero.l2_after", section: "hero", kind: "text", label: ["দ্বিতীয় লাইন, দাগের পরে", "Line 2, after underline"], bn: " জানান।", en: "." },
  { key: "hero.sub", section: "hero", kind: "long", label: ["নিচের লেখা", "Sub text"], bn: "দিনে তিনবার সুগার মেপে লিখে রাখুন। আপনার ডাক্তার সেই হিসাব দেখে বাংলায় পরামর্শ দেবেন।", en: "Write down your reading three times a day. Your doctor reads it and replies in plain words." },
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
  { key: "food.sub", section: "food", kind: "text", label: ["নিচের লেখা", "Sub text"], bn: "ঘরের খাবার দিয়েই শুরু করুন। কতটা খাচ্ছেন, সেটাই গুরুত্বপূর্ণ।", en: "Start with home food. Portion is what matters." },
  { key: "food.eat", section: "food", kind: "lines", hint: LINE, label: ["খাবেন", "Eat"], bn: "লাল চালের ভাত, অল্প পরিমাণে\nমসুর ও মুগ ডাল\nলাল শাক, পুঁই শাক, কলমি শাক\nকরলা, ঢেঁড়স, লাউ\nরুই, ইলিশ, কাঁচকি মাছ\nপেয়ারা, আমড়া, জাম্বুরা", en: "Red rice, small portion\nMasoor and mung dal\nRed, malabar and water spinach\nBitter gourd, okra, bottle gourd\nRui, ilish, small fish\nGuava, hog plum, pomelo" },
  { key: "food.avoid", section: "food", kind: "lines", hint: LINE, label: ["এড়াবেন", "Avoid"], bn: "সাদা ভাত বেশি পরিমাণে\nরসগোল্লা, মিষ্টি, পায়েস\nপরোটা, লুচি, সিঙ্গারা\nচিনি দেওয়া চা\nপাকা আম, কাঁঠাল বেশি\nকোমল পানীয়", en: "Large plates of white rice\nRoshogolla, mishti, payesh\nParatha, luchi, shingara\nTea with sugar\nLots of ripe mango, jackfruit\nSoft drinks" },
  { key: "pricing.sub", section: "pricing", kind: "text", label: ["নিচের লেখা", "Sub text"], bn: "প্রতি মাসের ফি টাকায় দেখানো হয়েছে। যেকোনো সময় বন্ধ করতে পারবেন।", en: "Monthly, in taka. Stop any time." },
  { key: "pricing.prices", section: "pricing", kind: "text", label: ["দাম (বিনামূল্যে, মাসিক, পরিবার) কমা দিয়ে", "Prices (Free, Monthly, Family), comma separated"], bn: "0, 499, 1199", en: "0, 499, 1199" },
  { key: "faq.items", section: "faq", kind: "lines", hint: PAIR, label: ["প্রশ্ন | উত্তর", "Question | answer"], bn: "আমার গ্লুকোমিটার লাগবে? | হ্যাঁ। যেকোনো ব্র্যান্ডের গ্লুকোমিটার চলবে। রিডিং হাতে লিখে দিলেই হবে।\nডাক্তাররা কি সত্যিই BMDC নিবন্ধিত? | হ্যাঁ। আমরা প্রত্যেকের নিবন্ধন নম্বর যাচাই করি এবং তাদের পাতায় দেখাই।\nবিকাশ বা নগদে ফি দেওয়া যাবে? | হ্যাঁ, বিকাশ, নগদ আর কার্ড — তিনটাই চলবে।\nআমার বাবা-মায়ের হিসাব কি আমি রাখতে পারব? | পারবেন। পরিবার প্ল্যানে একটা অ্যাকাউন্টে চারজন পর্যন্ত রাখা যায়।\nসুগার খুব কমে গেলে কী করব? | ৩.৯ mmol/L-এর নিচে হলে সঙ্গে সঙ্গে চিনি বা গ্লুকোজ খান। জ্ঞান হারালে নিকটস্থ হাসপাতালে যান।", en: "Do I need a glucometer? | Yes. Any brand works. You type the reading in yourself.\nAre the doctors really BMDC registered? | Yes. We check each registration number and show it on their page.\nCan I pay with bKash or Nagad? | Yes — bKash, Nagad and card all work.\nCan I keep a log for my parents? | Yes. The family plan holds up to four people on one account.\nWhat if my sugar drops very low? | Below 3.9 mmol/L, take sugar or glucose right away. If someone faints, go to the nearest hospital." },
  { key: "footer.address", section: "footer", kind: "text", label: ["ঠিকানা", "Address"], bn: "বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা ১২০৫", en: "House 12, Road 5, Dhanmondi, Dhaka 1205" },
  { key: "footer.phone", section: "footer", kind: "text", label: ["ফোন", "Phone"], bn: "+880 1711-000000", en: "+880 1711-000000" },
  { key: "footer.hours", section: "footer", kind: "text", label: ["খোলার সময়", "Opening hours"], bn: "শনি–বৃহস্পতি, সকাল ৯টা – রাত ৯টা", en: "Sat–Thu, 9am – 9pm" },
  { key: "footer.bmdc", section: "footer", kind: "long", label: ["BMDC নোট", "BMDC note"], bn: "সব ডাক্তার BMDC নিবন্ধিত। নিবন্ধন নম্বর প্রত্যেক ডাক্তারের পাতায় দেওয়া আছে।", en: "Every doctor is BMDC registered. Registration numbers are on each doctor's page." },
  { key: "footer.emergency", section: "footer", kind: "long", label: ["জরুরি সতর্কতা", "Emergency notice"], bn: "জরুরি অবস্থায় হাসপাতালে যান। এই সেবা হাসপাতালের বিকল্প নয়।", en: "In an emergency, this platform is not a substitute for a hospital." },
  { key: "header.cta", section: "header", kind: "text", label: ["উপরের সবুজ বোতাম", "Top green button"], bn: "সুগার লিখুন", en: "Log your sugar" },
  { key: "doctors.see_all", section: "doctors", kind: "text", label: ["সব ডাক্তার লিংক", "See-all link"], bn: "সব ডাক্তার দেখুন", en: "See all doctors" },
  { key: "doctors.join_btn", section: "doctors", kind: "text", label: ["যোগ দেওয়ার বোতাম", "Join button"], bn: "ডাক্তার হিসেবে যোগ দিন", en: "Join as a doctor" },
  { key: "food.eat_title", section: "food", kind: "text", label: ["খাবেন শিরোনাম", "Eat heading"], bn: "খাবেন", en: "Eat" },
  { key: "food.avoid_title", section: "food", kind: "text", label: ["এড়াবেন শিরোনাম", "Avoid heading"], bn: "এড়াবেন", en: "Avoid" },
  { key: "pricing.title", section: "pricing", kind: "text", label: ["শিরোনাম", "Heading"], bn: "ফি", en: "Pricing" },
  { key: "faq.title", section: "faq", kind: "text", label: ["শিরোনাম", "Heading"], bn: "সাধারণ প্রশ্ন", en: "Questions" },
  { key: "pages.doctors_title", section: "pages", kind: "text", label: ["ডাক্তার পাতা: শিরোনাম", "Doctors page: heading"], bn: "ডাক্তার খুঁজুন", en: "Find a doctor" },
  { key: "pages.doctors_sub", section: "pages", kind: "long", label: ["ডাক্তার পাতা: নিচের লেখা", "Doctors page: sub text"], bn: "সবাই BMDC নিবন্ধিত। নিবন্ধন নম্বর পাশে দেওয়া আছে।", en: "All are BMDC registered. The number is shown beside each name." },
  { key: "pages.articles_title", section: "pages", kind: "text", label: ["লেখা পাতা: শিরোনাম", "Articles page: heading"], bn: "লেখা", en: "Articles" },
  { key: "pages.articles_sub", section: "pages", kind: "long", label: ["লেখা পাতা: নিচের লেখা", "Articles page: sub text"], bn: "ডাক্তার ও পুষ্টিবিদদের লেখা, সহজ ভাষায়।", en: "Written by doctors and nutritionists, in plain words." },
  { key: "pages.diet_kicker", section: "pages", kind: "text", label: ["খাদ্য পাতা: ছোট লেখা", "Diet page: small label"], bn: "সাপ্তাহিক খাদ্য তালিকা", en: "Weekly diet chart" },
  { key: "pages.diet_title", section: "pages", kind: "text", label: ["খাদ্য পাতা: শিরোনাম", "Diet page: heading"], bn: "এই সপ্তাহে কী খাবেন", en: "What to eat this week" },
  { key: "pages.diet_sub", section: "pages", kind: "long", label: ["খাদ্য পাতা: নিচের লেখা", "Diet page: sub text"], bn: "প্রায় ১৫০০–১৮০০ ক্যালরি। আপনার ডাক্তার পরিমাণ বদলে দিতে পারেন।", en: "About 1500\u20131800 kcal. Your doctor may adjust portions." },
  { key: "pages.ex_kicker", section: "pages", kind: "text", label: ["ব্যায়াম পাতা: ছোট লেখা", "Exercise page: small label"], bn: "ব্যায়াম", en: "Exercise" },
  { key: "pages.ex_title", section: "pages", kind: "text", label: ["ব্যায়াম পাতা: শিরোনাম", "Exercise page: heading"], bn: "সহজ তিনটা ব্যায়াম", en: "Three simple exercises" },
  { key: "pages.ex_sub", section: "pages", kind: "long", label: ["ব্যায়াম পাতা: নিচের লেখা", "Exercise page: sub text"], bn: "নতুন ব্যায়াম শুরুর আগে ডাক্তারকে জানান। সুগার ৭০-এর নিচে থাকলে ব্যায়াম করবেন না।", en: "Tell your doctor before starting. Don't exercise if your sugar is below 70." },
  { key: "sub.title", section: "subscription", kind: "text", label: ["শিরোনাম", "Heading"], bn: "প্ল্যান ও ফি", en: "Plans and fees" },
  { key: "sub.sub", section: "subscription", kind: "long", label: ["নিচের লেখা", "Sub text"], bn: "যেকোনো সময় প্ল্যান বন্ধ করতে পারবেন। বিকাশ বা নগদে ফি দিতে পারবেন।", en: "Cancel any time. Pay by bKash or Nagad." },
  { key: "header.links", section: "header", kind: "lines", hint: PAIR, label: ["মেনুর লিংক (নাম | ঠিকানা)", "Menu links (name | address)"], bn: "লেখা | /articles\nডাক্তার | /doctors\nখাদ্য তালিকা | /diet\nব্যায়াম | /exercise", en: "Articles | /articles\nDoctors | /doctors\nDiet chart | /diet\nExercise | /exercise" },
  { key: "pricing.plan_names", section: "pricing", kind: "lines", hint: LINE, label: ["প্ল্যানের নাম (৩টা)", "Plan names (3)"], bn: "বিনামূল্যে\nমাসিক\nপরিবার", en: "Free\nMonthly\nFamily" },
  { key: "pricing.rows", section: "pricing", kind: "lines", hint: ["প্রতি লাইনে: বিষয় | বিনামূল্যে | মাসিক | পরিবার", "Each line: feature | free | monthly | family"], label: ["প্রথম পাতার তুলনা", "Home page comparison"], bn: "সুগারের হিসাব | আছে | আছে | আছে\nডাক্তারের পরামর্শ | — | মাসে ১ বার | মাসে ৩ বার\nখাদ্য তালিকা | সাধারণ | ব্যক্তিগত | ব্যক্তিগত\nকতজন | ১ | ১ | ৪", en: "Sugar log | Yes | Yes | Yes\nDoctor consults | — | 1 per month | 3 per month\nFood list | Basic | Personal | Personal\nPeople | 1 | 1 | 4" },
  { key: "sub.rows", section: "subscription", kind: "lines", hint: ["প্রতি লাইনে: বিষয় | বিনামূল্যে | মাসিক | পরিবার", "Each line: feature | free | monthly | family"], label: ["তুলনার সারি", "Comparison rows"], bn: "সুগারের খাতা ও চার্ট | আছে | আছে | আছে\nএসএমএস/হোয়াটসঅ্যাপ চেক-ইন | — | দিনে ৩ বার | দিনে ৩ বার\nডাক্তারের পরামর্শ | — | মাসে ১ বার | মাসে ৩ বার\nসাপ্তাহিক খাদ্য তালিকা | সাধারণ | ব্যক্তিগত | ব্যক্তিগত\nপ্রিন্টযোগ্য প্রেসক্রিপশন | — | আছে | আছে\nকতজন | ১ জন | ১ জন | ৪ জন পর্যন্ত", en: "Sugar diary and chart | Yes | Yes | Yes\nSMS / WhatsApp check-ins | — | 3 a day | 3 a day\nDoctor consults | — | 1 a month | 3 a month\nWeekly diet chart | General | Personal | Personal\nPrintable prescription | — | Yes | Yes\nPeople | 1 | 1 | Up to 4" },
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
