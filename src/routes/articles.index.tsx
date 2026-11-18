import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { useLang } from "@/lib/i18n";
import { useCms } from "@/lib/cms";
import { formatDhaka, formatNumber } from "@/lib/locale";
import { useArticles } from "@/lib/use-articles";
import plate from "@/assets/articles/plate.jpg";

export const Route = createFileRoute("/articles/")({
  head: () => ({ meta: [
    { title: "Diabetes articles by Bangladeshi doctors — Diacare" },
    { name: "description", content: "Plain-language articles on food, sugar checks, Ramadan and foot care, written by doctors and nutritionists." },
    { property: "og:title", content: "Articles — Diacare" },
    { property: "og:description", content: "Diabetes advice from Bangladeshi doctors, in Bangla and English." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  const { lang, t } = useLang();
  const { c } = useCms();
  const articles = useArticles();
  const lead = articles[0]; const rest = articles.slice(1);
  if (!lead) return <div className="min-h-screen"><SiteHeader /><p className="mx-auto max-w-6xl px-6 py-12 text-muted-foreground">{t("এখনো কোনো লেখা নেই।", "No articles yet.")}</p><SiteFooter /></div>;
  const meta = (a: NonNullable<typeof lead>) => `${t(a.author.bn, a.author.en)} · ${formatNumber(a.minutes, lang)} ${t("মিনিটে পড়া", "min read")}`;
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <header className="border-b-2 border-primary pb-4">
          <h1 className="font-display text-4xl font-semibold">{c("pages.articles_title")}</h1>
          <p className="mt-1 text-muted-foreground">{c("pages.articles_sub")}</p>
        </header>
        <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <Link to="/articles/$slug" params={{ slug: lead.slug }} className="group block">
            <img src={lead.image || plate} alt={t("লাল চালের ভাত, রুই মাছ আর লাউয়ের তরকারির প্লেট", "Plate of red rice, rui fish and lau curry")} width={1200} height={912} className="aspect-[4/3] w-full rounded-[10px] object-cover" />
            <p className="mt-5 text-sm font-medium tracking-wide text-accent uppercase">{t(lead.catBn, lead.catEn)}</p>
            <h2 className="mt-1 font-display text-4xl leading-tight font-semibold transition-colors duration-150 group-hover:text-primary">{t(lead.titleBn, lead.titleEn)}</h2>
            <p className="mt-3 text-lg text-muted-foreground">{t(lead.deckBn, lead.deckEn)}</p>
            <p className="mt-3 text-sm">{meta(lead)}</p>
          </Link>
          <ol className="divide-y divide-border border-t border-border">
            {rest.map((a) => (
              <li key={a.slug}>
                <Link to="/articles/$slug" params={{ slug: a.slug }} className="group block py-5">
                  <p className="text-xs font-medium tracking-wide text-accent uppercase">{t(a.catBn, a.catEn)}</p>
                  <h3 className="mt-1 font-display text-2xl leading-snug font-semibold transition-colors duration-150 group-hover:text-primary">{t(a.titleBn, a.titleEn)}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{meta(a)} · {formatDhaka(new Date(a.date), lang, { dateStyle: "medium" })}</p>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
