export type Block = { kind: "p" | "h" | "quote"; bn: string; en: string };
export type Author = { slug: string; bn: string; en: string; roleBn: string; roleEn: string };
export type Article = { slug: string; catBn: string; catEn: string; titleBn: string; titleEn: string; deckBn: string; deckEn: string; minutes: number; date: string; author: Author; body: Block[]; image?: string };

const A = {
  nasrin: { slug: "nasrin-islam", bn: "ডা. নাসরিন ইসলাম", en: "Dr. Nasrin Islam", roleBn: "এন্ডোক্রাইনোলজিস্ট, ঢাকা", roleEn: "Endocrinologist, Dhaka" },
  farhana: { slug: "farhana-chowdhury", bn: "ফারহানা চৌধুরী", en: "Farhana Chowdhury", roleBn: "পুষ্টিবিদ", roleEn: "Nutritionist" },
  rafiqul: { slug: "rafiqul-hasan", bn: "ডা. রফিকুল হাসান", en: "Dr. Rafiqul Hasan", roleBn: "ডায়াবেটোলজিস্ট", roleEn: "Diabetologist" },
  mahmud: { slug: "mahmud-karim", bn: "ডা. মাহমুদ করিম", en: "Dr. Mahmud Karim", roleBn: "মেডিসিন বিশেষজ্ঞ", roleEn: "Internal medicine" },
} satisfies Record<string, Author>;

const p = (bn: string, en: string): Block => ({ kind: "p", bn, en });
const h = (bn: string, en: string): Block => ({ kind: "h", bn, en });
const q = (bn: string, en: string): Block => ({ kind: "quote", bn, en });

export const articles: Article[] = [
  { slug: "rice-plate", catBn: "খাবার", catEn: "Food", minutes: 6, date: "2026-11-02", author: A.farhana,
    titleBn: "ভাত ছাড়তে হবে না, প্লেটটা বদলান", titleEn: "You don't have to give up rice — change the plate",
    deckBn: "প্লেটের অর্ধেক সবজি, এক-চতুর্থাংশ মাছ বা ডাল, আর এক-চতুর্থাংশ ভাত রাখুন। আমাদের খাবারে মেনে চলার সহজ একটা নিয়ম।", deckEn: "Half vegetables, a quarter fish or dal, a quarter rice. A simple rule for a Bangladeshi plate.",
    body: [
      p("ডায়াবেটিস ধরা পড়লে অনেকেই প্রথমে ভাত একেবারে বাদ দেন। কয়েক সপ্তাহ পর আবার আগের মতো খেতে শুরু করেন। বরং কতটা ভাত খাচ্ছেন আর সঙ্গে কী খাচ্ছেন, সেটা বদলান। এই অভ্যাস ধরে রাখা সহজ।", "Many people drop rice entirely after diagnosis, then go back to old habits a few weeks later. A more lasting approach is changing the amount and what goes with it."),
      h("প্লেটের নিয়ম", "The plate rule"),
      p("প্লেটের অর্ধেক ভরুন লাউ, পটল, শাক, শসার মতো সবজি দিয়ে। এক-চতুর্থাংশে মাছ, মুরগি বা ডাল। বাকি এক-চতুর্থাংশে ভাত — মোটামুটি এক কাপ।", "Fill half the plate with vegetables like lau, potol, shak or cucumber. A quarter with fish, chicken or dal. The last quarter with rice — about one cup."),
      q("আগে সবজি আর মাছ খান, ভাত শেষে। একই খাবারে সুগার কম বাড়ে।", "Eat the vegetables and fish first, rice last. The same meal raises sugar less."),
      h("লাল চাল কি ভালো?", "Is red rice better?"),
      p("লাল চাল বা ঢেঁকিছাঁটা চালে আঁশ বেশি, তাই সুগার ধীরে বাড়ে। তবে পরিমাণ বেশি হলে লাভ থাকে না।", "Red or hand-pounded rice has more fibre, so sugar rises more slowly. But a large portion cancels the benefit."),
    ] },
  { slug: "fasting-sugar-morning", catBn: "সুগার মাপা", catEn: "Monitoring", minutes: 4, date: "2026-10-28", author: A.nasrin,
    titleBn: "সকালের সুগার কেন বেশি আসে", titleEn: "Why your morning sugar reads high",
    deckBn: "রাতে কম খেয়েও খালি পেটে ১৪০? তিনটা সাধারণ কারণ।", deckEn: "Ate little at night but fasting sugar is 140? Three common reasons.",
    body: [
      p("ভোরের দিকে শরীরে কিছু হরমোন তৈরি হয়। এগুলোর কারণে লিভার থেকে রক্তে গ্লুকোজ আসে। এটাকে ডন ফেনোমেনন বলে।", "In the early hours the body releases hormones that push glucose out of the liver. This is called the dawn phenomenon."),
      q("টানা তিন দিন খালি পেটে ১৩০-এর বেশি এলে ডাক্তারকে জানান।", "If fasting sugar is above 130 three days in a row, tell your doctor."),
      p("রাতের খাবার দেরিতে খেলে বা ওষুধ খাওয়ার সময় ঠিক না থাকলেও এমন হতে পারে। খাতায় লিখে রাখুন। কখন সুগার বাড়ছে, ডাক্তার তা বুঝতে পারবেন।", "Late dinners or irregular medicine times can do this too. Write it down so your doctor can see the pattern."),
    ] },
  { slug: "ramadan-diabetes", catBn: "রোজা", catEn: "Ramadan", minutes: 7, date: "2026-10-20", author: A.rafiqul,
    titleBn: "ডায়াবেটিস নিয়ে রোজা রাখার আগে", titleEn: "Before fasting in Ramadan with diabetes", deckBn: "", deckEn: "",
    body: [p("রোজার অন্তত এক মাস আগে ডাক্তারের সঙ্গে ওষুধের সময় ঠিক করুন।", "Plan medicine timings with your doctor at least a month before Ramadan."), q("সুগার ৭০-এর নিচে নামলে রোজা ভাঙুন। এটা নিয়ম, অপরাধ নয়।", "If sugar drops below 70, break the fast. That is the rule, not a failing.")] },
  { slug: "foot-care", catBn: "পায়ের যত্ন", catEn: "Foot care", minutes: 5, date: "2026-10-12", author: A.mahmud,
    titleBn: "প্রতি রাতে এক মিনিট পা দেখুন", titleEn: "One minute a night for your feet", deckBn: "", deckEn: "",
    body: [p("ঘুমানোর আগে আয়না দিয়ে পায়ের তলা দেখুন। কোথাও কেটেছে কি না, ফোসকা পড়েছে কি না বা রং বদলেছে কি না খেয়াল করুন।", "Before bed, check the soles of your feet with a mirror — cuts, blisters, colour change."), q("খালি পায়ে হাঁটবেন না, ঘরের ভেতরেও না।", "Don't walk barefoot, not even indoors.")] },
  { slug: "hypo-signs", catBn: "জরুরি", catEn: "Emergency", minutes: 3, date: "2026-10-05", author: A.nasrin,
    titleBn: "সুগার কমে গেলে কী করবেন", titleEn: "What to do when sugar goes low", deckBn: "", deckEn: "",
    body: [p("হাত কাঁপা, ঘাম, বুক ধড়ফড় — এগুলো সুগার কমার লক্ষণ।", "Shaking, sweating, a racing heart — these are signs of low sugar."), q("৩ চামচ চিনি পানিতে গুলে খান, ১৫ মিনিট পর আবার মাপুন।", "Drink 3 spoons of sugar in water, check again after 15 minutes.")] },
];
