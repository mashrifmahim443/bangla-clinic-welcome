import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { useLang } from "@/lib/i18n";
import { formatDhaka, formatNumber } from "@/lib/locale";
import { articles } from "@/lib/articles";
import { doctorPhotos } from "@/lib/doctors";

export const Route = createFileRoute("/articles/$slug")({
  loader: ({ params }) => {
    const article = articles.find((a) => a.slug === params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    const a = loaderData?.article;
    const title = a ? `${a.titleEn} — DiabeCare` : "Article — DiabeCare";
    const desc = a ? (a.deckEn || a.body[0]?.en || "") : "";
    return { meta: [
      { title }, { name: "description", content: desc },
      { property: "og:title", content: title }, { property: "og:description", content: desc },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  notFoundComponent: () => <p className="p-10">Article not found. <Link to="/articles" className="text-primary underline">All articles</Link></p>,
  component: Page,
});

function Page() {
  const { article: a } = Route.useLoaderData();
  const { lang, t } = useLang();
  const photo = doctorPhotos[a.author.slug];
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <article className="mx-auto max-w-[680px] px-4 py-14">
        <Link to="/articles" className="text-sm text-primary underline underline-offset-4">{t("← সব লেখা", "← All articles")}</Link>
        <p className="mt-8 text-sm font-medium tracking-wide text-accent uppercase">{t(a.catBn, a.catEn)}</p>
        <h1 className="mt-2 font-display text-5xl leading-[1.1] font-semibold">{t(a.titleBn, a.titleEn)}</h1>
        {a.deckBn && <p className="mt-4 text-xl text-muted-foreground">{t(a.deckBn, a.deckEn)}</p>}
        <p className="mt-5 border-b border-border pb-6 text-sm">
          {t(a.author.bn, a.author.en)} · {formatDhaka(new Date(a.date), lang, { dateStyle: "long" })} · {formatNumber(a.minutes, lang)} {t("মিনিটে পড়া", "min read")}
        </p>
        <div className="mt-8 space-y-6 text-lg leading-relaxed">
          {a.body.map((b, i) =>
            b.kind === "h" ? <h2 key={i} className="pt-4 font-display text-2xl font-semibold">{t(b.bn, b.en)}</h2>
            : b.kind === "quote" ? (
              <blockquote key={i} className="my-10 border-y border-primary py-6 font-display text-2xl leading-snug text-primary">
                {t(b.bn, b.en)}
              </blockquote>
            ) : <p key={i}>{t(b.bn, b.en)}</p>,
          )}
        </div>
        <footer className="mt-14 flex gap-4 border-t border-border pt-6">
          {photo && <img src={photo} alt="" width={64} height={64} loading="lazy" className="h-16 w-16 rounded-md object-cover" />}
          <div>
            <p className="text-sm text-muted-foreground">{t("লিখেছেন", "Written by")}</p>
            <p className="font-display text-lg font-semibold">{t(a.author.bn, a.author.en)}</p>
            <p className="text-sm text-muted-foreground">{t(a.author.roleBn, a.author.roleEn)}</p>
            <p className="mt-2 text-sm">{t("এই লেখা সাধারণ তথ্যের জন্য। নিজের ওষুধ বদলানোর আগে ডাক্তারের সঙ্গে কথা বলুন।", "This article is general information. Talk to your doctor before changing your own medicines.")}</p>
          </div>
        </footer>
      </article>
      <SiteFooter />
    </div>
  );
}
