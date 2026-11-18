import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { useLang } from "@/lib/i18n";
import { useCms } from "@/lib/cms";
import walk from "@/assets/exercise/walk.jpg";
import { defaultExercises, type Ex } from "@/lib/exercise";

export const Route = createFileRoute("/exercise")({
  head: () => ({ meta: [
    { title: "Simple exercises for diabetes — Diacare" },
    { name: "description", content: "Brisk walking, chair sit-to-stand and seated leg exercises, explained step by step in Bangla and English." },
    { property: "og:title", content: "Simple exercises for diabetes — Diacare" },
    { property: "og:description", content: "Three easy exercises with step-by-step instructions." },
    { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  const { t } = useLang();
  const { c } = useCms();
  const saved = useCms().json<Ex[] | null>("exercise", null);
  const exercises = Array.isArray(saved) ? saved.map((e, i) => ({ ...e, img: e.img || defaultExercises[i]?.img || walk })) : defaultExercises;
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm text-muted-foreground">{c("pages.ex_kicker")}</p>
        <h1 className="font-display text-4xl font-semibold">{c("pages.ex_title")}</h1>
        <p className="mt-2 max-w-2xl text-lg text-muted-foreground">{c("pages.ex_sub")}</p>
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
