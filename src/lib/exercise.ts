import walk from "@/assets/exercise/walk.jpg";
import chair from "@/assets/exercise/chair.jpg";
import legs from "@/assets/exercise/legs.jpg";

export type Ex = { img: string; titleBn: string; titleEn: string; whenBn: string; whenEn: string; steps: [string, string][] };
export const defaultExercises: Ex[] = [
  { img: walk, titleBn: "জোরে হাঁটা", titleEn: "Brisk walking", whenBn: "প্রতিদিন ৩০ মিনিট, খাওয়ার পরে", whenEn: "30 minutes daily, after a meal", steps: [
    ["আরামদায়ক স্যান্ডেল বা জুতা পরুন।", "Wear comfortable sandals or shoes."],
    ["প্রথম ৫ মিনিট ধীরে হাঁটুন।", "Walk slowly for the first 5 minutes."],
    ["এরপর একটু জোরে হাঁটুন। এমনভাবে হাঁটবেন যেন কথা বলতে পারেন, কিন্তু গান গাইতে না পারেন।", "Then walk fast enough that you can talk but not sing."],
    ["শেষ ৫ মিনিট আবার ধীরে হাঁটুন।", "Slow down again for the last 5 minutes."],
  ] },
  { img: chair, titleBn: "চেয়ার থেকে ওঠা-বসা", titleEn: "Chair sit-to-stand", whenBn: "দিনে ২ বার, ১০ বার করে", whenEn: "Twice a day, 10 times each", steps: [
    ["মজবুত একটা চেয়ারের সামনের দিকে বসুন। দুই পা মাটিতে রাখুন।", "Sit near the front of a sturdy chair, feet flat."],
    ["হাত বুকের ওপর রাখুন।", "Cross your arms over your chest."],
    ["হাতে ভর না দিয়ে ধীরে উঠে দাঁড়ান।", "Stand up slowly without using your hands."],
    ["ধীরে আবার বসুন। মাথা ঘুরলে থামুন।", "Sit back down slowly. Stop if you feel dizzy."],
  ] },
  { img: legs, titleBn: "বসে পায়ের ব্যায়াম", titleEn: "Seated leg exercises", whenBn: "টিভি দেখার সময়, দিনে ২–৩ বার", whenEn: "While watching TV, 2–3 times a day", steps: [
    ["চেয়ারে সোজা হয়ে বসুন।", "Sit up straight on a chair."],
    ["এক পা একটু তুলে গোড়ালি ১০ বার ঘোরান। তারপর উল্টো দিকে ঘোরান।", "Lift one foot and circle the ankle 10 times, then the other way."],
    ["পা সোজা করে তুলুন। ৩ সেকেন্ড ধরে রেখে নামিয়ে ফেলুন।", "Straighten the leg, hold 3 seconds, lower it."],
    ["প্রতি পায়ে ১০ বার করুন।", "Do 10 on each leg."],
  ] },
];

