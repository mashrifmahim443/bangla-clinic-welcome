export type GI = "low" | "medium" | "high";
export type Cell = { bn: string; en: string; portionBn: string; portionEn: string; gi: GI };
export const days: [string, string][] = [["শনি","Sat"],["রবি","Sun"],["সোম","Mon"],["মঙ্গল","Tue"],["বুধ","Wed"],["বৃহঃ","Thu"],["শুক্র","Fri"]];
export const meals: [string, string, string][] = [["সকালের নাশতা","Breakfast","৭–৮টা"],["মাঝ সকাল","Mid-morning","১০–১১টা"],["দুপুর","Lunch","১–২টা"],["বিকেল","Afternoon","৫টা"],["রাত","Dinner","৮–৯টা"]];
const c = (bn: string, en: string, portionBn: string, portionEn: string, gi: GI): Cell => ({ bn, en, portionBn, portionEn, gi });
const B = [
  c("আটার রুটি, সবজি ভাজি","Atta roti, mixed veg","২টা রুটি, ১ বাটি","2 roti, 1 bowl","low"),
  c("ওটস খিচুড়ি","Oats khichuri","১ বাটি","1 bowl","low"),
  c("লাল আটার রুটি, ডিম সেদ্ধ","Brown atta roti, boiled egg","২টা রুটি, ১টা ডিম","2 roti, 1 egg","low"),
  c("চিড়া, টক দই","Chira with yoghurt","আধা কাপ চিড়া","½ cup chira","medium"),
  c("আটার রুটি, ডাল","Atta roti, dal","২টা রুটি, আধা বাটি","2 roti, ½ bowl","low"),
  c("সুজির উপমা, সবজি","Suji upma with veg","১ বাটি","1 bowl","medium"),
  c("পরোটা (কম তেলে), ডিম","Paratha (little oil), egg","১টা, ১টা ডিম","1 paratha, 1 egg","high"),
];
const M = [
  c("পেয়ারা","Guava","১টা মাঝারি","1 medium","low"), c("শসা, গাজর","Cucumber, carrot","১ প্লেট","1 plate","low"),
  c("আপেল","Apple","১টা ছোট","1 small","low"), c("ভাজা ছোলা","Roasted chickpeas","এক মুঠো","1 handful","low"),
  c("জাম্বুরা","Pomelo","৩–৪ কোয়া","3–4 segments","low"), c("কাঠবাদাম","Almonds","৮–১০টা","8–10","low"),
  c("পাকা পেঁপে","Ripe papaya","১ টুকরা","1 slice","medium"),
];
const L = [
  c("লাল চালের ভাত, রুই মাছ, লাউ","Red rice, rui fish, lau","১ কাপ ভাত, ১ টুকরা মাছ","1 cup rice, 1 piece fish","medium"),
  c("ভাত, মুরগি, পালং শাক","Rice, chicken, spinach","১ কাপ ভাত, ২ টুকরা","1 cup rice, 2 pieces","medium"),
  c("লাল চালের ভাত, মসুর ডাল, ঢেঁড়স","Red rice, masoor dal, okra","১ কাপ, ১ বাটি ডাল","1 cup, 1 bowl dal","medium"),
  c("ভাত, ইলিশ, করলা","Rice, hilsa, bitter gourd","১ কাপ ভাত, ১ টুকরা","1 cup rice, 1 piece","medium"),
  c("রুটি, মাছের ঝোল, সালাদ","Roti, fish curry, salad","৩টা রুটি","3 roti","low"),
  c("লাল চালের ভাত, পাঙ্গাস, পটল","Red rice, pangas, potol","১ কাপ ভাত","1 cup rice","medium"),
  c("পোলাও, মুরগির রোস্ট","Polao, chicken roast","আধা কাপ পোলাও","½ cup polao","high"),
];
const A = [
  c("চিনি ছাড়া চা, মুড়ি","Tea (no sugar), muri","১ কাপ মুড়ি","1 cup muri","high"),
  c("ছোলা সেদ্ধ","Boiled chickpeas","আধা কাপ","½ cup","low"),
  c("চিনি ছাড়া চা, ২টা বিস্কুট","Tea, 2 marie biscuits","২টা","2","medium"),
  c("টক দই","Plain yoghurt","১ ছোট বাটি","1 small bowl","low"),
  c("চিনি ছাড়া লেবু পানি","Lemon water (no sugar)","১ গ্লাস","1 glass","low"),
  c("পেয়ারা","Guava","১টা","1","low"),
  c("চিনি ছাড়া চা, চানাচুর","Tea, chanachur","২ চামচ","2 spoons","medium"),
];
const D = [
  c("আটার রুটি, মুরগির তরকারি","Atta roti, chicken curry","২টা রুটি, ১ টুকরা","2 roti, 1 piece","low"),
  c("রুটি, ডাল, সবজি","Roti, dal, veg","২টা রুটি","2 roti","low"),
  c("লাল চালের ভাত, টাকি মাছ ভর্তা","Red rice, taki fish bhorta","আধা কাপ ভাত","½ cup rice","medium"),
  c("রুটি, ডিমের তরকারি","Roti, egg curry","২টা রুটি, ১টা ডিম","2 roti, 1 egg","low"),
  c("সবজি খিচুড়ি (ডাল বেশি)","Veg khichuri (more dal)","১ বাটি","1 bowl","medium"),
  c("রুটি, মাছ, শাক","Roti, fish, shak","২টা রুটি","2 roti","low"),
  c("রুটি, গরুর মাংস (চর্বি ছাড়া)","Roti, lean beef","২টা রুটি, ২ টুকরা","2 roti, 2 pieces","low"),
];
export const plan: Cell[][] = [B, M, L, A, D];
