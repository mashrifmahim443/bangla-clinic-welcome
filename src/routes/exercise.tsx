import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { useLang } from "@/lib/i18n";
import { useCms } from "@/lib/cms";
import walk from "@/assets/exercise/walk.jpg";
import chair from "@/assets/exercise/chair.jpg";
import legs from "@/assets/exercise/legs.jpg";

export const Route = createFileRoute("/exercise")({
  head: () => ({ meta: [
    { title: "Simple exercises for diabetes — DiabeCare" },
    { name: "description", content: "Brisk walking, chair sit-to-stand and seated leg exercises, explained step by step in Bangla and English." },
    { property: "og:title", content: "Simple exercises for diabetes — DiabeCare" },
    { property: "og:description", content: "Three easy exercises with step-by-step instructions." },
    { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

export type Ex = { img: string; titleBn: string; titleEn: string; whenBn: string; whenEn: string; steps: [string, string][] };
export const defaultExercises: Ex[] = [
  { img: walk, titleBn: "জোরে হাঁটা", titleEn: "Brisk walking", whenBn: "প্রতিদিন ৩০ মিনিট, খাওয়ার পরে", whenEn: "30 minutes daily, after a meal", steps: [
    ["আরামদায়ক স্যান্ডেল বা জুতা পরুন।", "Wear comfortable sandals or shoes."],
    ["প্রথম ৫ মিনিট ধীরে হাঁটুন।", "Walk slowly for the first 5 minutes."],
    ["এরপর এমন গতিতে হাঁটুন যাতে কথা বলা যায়, গান গাওয়া যায় না।", "Then walk fast enough that you can talk but not sing."],
    ["শেষ ৫ মিনিট আবার ধীরে হাঁটুন।", "Slow down again for the last 5 minutes."],
  ] },
  { img: chair, titleBn: "চেয়ার থেকে ওঠা-বসা", titleEn: "Chair sit-to-stand", whenBn: "দিনে ২ বার, ১০ বার করে", whenEn: "Twice a day, 10 times each", steps: [
    ["শক্ত একটা চেয়ারের সামনের দিকে বসুন, পা মাটিতে।", "Sit near the front of a sturdy chair, feet flat."],
    ["হাত বুকের ওপর রাখুন।", "Cross your arms over your chest."],
    ["হাতের ভর ছাড়া ধীরে উঠে দাঁড়ান।", "Stand up slowly without using your hands."],
    ["ধীরে আবার বসুন। মাথা ঘুরলে থামুন।", "Sit back down slowly. Stop if you feel dizzy."],
  ] },
  { img: legs, titleBn: "বসে পায়ের ব্যায়াম", titleEn: "Seated leg exercises", whenBn: "টিভি দেখার সময়, দিনে ২–৩ বার", whenEn: "While watching TV, 2–3 times a day", steps: [
    ["চেয়ারে সোজা হয়ে বসুন।", "Sit up straight on a chair."],
    ["এক পা একটু তুলে গোড়ালি ১০ বার ঘোরান, তারপর উল্টো দিকে।", "Lift one foot and circle the ankle 10 times, then the other way."],
    ["পা সোজা করে তুলুন, ৩ সেকেন্ড ধরে রাখুন, নামান।", "Straighten the leg, hold 3 seconds, lower it."],
    ["প্রতি পায়ে ১০ বার করুন।", "Do 10 on each leg."],
  ] },
];

function Page() {
  const { t } = useLang();
  const saved = useCms().json<Ex[] | null>("exercise", null);
  const exercises = Array.isArray(saved) ? saved.map((e, i) => ({ ...e, img: e.img || defaultExercises[i]?.img || walk })) : defaultExercises;
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm text-muted-foreground">{t("ব্যায়াম", "Exercise")}</p>
        <h1 className="font-display text-4xl font-semibold">{t("সহজ তিনটা ব্যায়াম", "Three simple exercises")}</h1>
        <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{t("নতুন ব্যায়াম শুরুর আগে ডাক্তারকে জানান। সুগার ৭০-এর নিচে থাকলে ব্যায়াম করবেন না।", "Tell your doctor before starting. Don't exercise if your sugar is below 70.")}</p>
        {exercises.map((ex, idx) => (
          <section key={ex.titleEn} className="mt-14 grid gap-8 border-t border-border pt-10 md:grid-cols-[22rem_1fr]">
            <img src={ex.img} alt={t(ex.titleBn, ex.titleEn)} loading="lazy" width={816} height={816} className="w-full rounded-[10px] border border-border" />
            <div>
              <h2 className="font-display text-3xl font-semibold">{idx + 1}. {t(ex.titleBn, ex.titleEn)}</h2>
              <p className="mt-1 text-accent">{t(ex.whenBn, ex.whenEn)}</p>
              <ol className="mt-6 space-y-5">
                {ex.steps.map(([bn, en], i) => (
                  <li key={i} className="flex gap-4">
                    <span className="font-display text-3xl leading-none font-semibold text-primary">{i + 1}</span>
                    <span className="text-xl leading-snug">{t(bn, en)}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
