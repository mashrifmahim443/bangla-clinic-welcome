import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { useLang } from "@/lib/i18n";
import { days, meals, plan as defaultPlan, type Cell, type GI } from "@/lib/diet";
import { useCms } from "@/lib/cms";

export const Route = createFileRoute("/diet")({
  head: () => ({ meta: [
    { title: "Weekly diabetes diet chart in Bangla — DiabeCare" },
    { name: "description", content: "A printable 7-day meal chart with Bangladeshi foods, portions and glycemic index tags." },
    { property: "og:title", content: "Weekly diabetes diet chart — DiabeCare" },
    { property: "og:description", content: "7-day chart of Bangladeshi meals with portions and GI tags." },
    { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

const giStyle: Record<GI, string> = {
  low: "border-glucose-ok text-glucose-ok",
  medium: "border-glucose-high text-glucose-high",
  high: "border-glucose-low text-glucose-low",
};
function GiTag({ gi }: { gi: GI }) {
  const { t } = useLang();
  const { c } = useCms();
  const label = { low: t("কম GI", "Low GI"), medium: t("মাঝারি GI", "Med GI"), high: t("বেশি GI", "High GI") }[gi];
  return <span className={`inline-block rounded-[3px] border px-1 text-[11px] leading-4 ${giStyle[gi]}`}>{label}</span>;
}

function Page() {
  const { t } = useLang();
  const saved = useCms().json<Cell[][] | null>("diet_plan", null);
  const plan = Array.isArray(saved) && saved.length === 5 ? saved : defaultPlan;
  return (
    <div className="min-h-screen">
      <div className="print:hidden"><SiteHeader /></div>
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-primary pb-4">
          <div>
            <p className="text-sm text-muted-foreground">{c("pages.diet_kicker")}</p>
            <h1 className="font-display text-3xl font-semibold">{c("pages.diet_title")}</h1>
            <p className="mt-1 text-muted-foreground">{c("pages.diet_sub")}</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <GiTag gi="low" /><GiTag gi="medium" /><GiTag gi="high" />
            <button onClick={() => window.print()} className="ml-2 rounded-md border border-border bg-card px-3 py-1.5 transition-colors duration-150 hover:bg-secondary print:hidden">{t("প্রিন্ট করুন", "Print")}</button>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[60rem] table-fixed border-collapse border border-border bg-card text-sm">
            <thead>
              <tr>
                <th className="w-32 border border-border bg-secondary p-2 text-left font-display font-semibold">{t("বেলা", "Meal")}</th>
                {days.map(([bn, en]) => <th key={en} className="border border-border bg-secondary p-2 font-display font-semibold">{t(bn, en)}</th>)}
              </tr>
            </thead>
            <tbody>
              {meals.map(([bn, en, time], r) => (
                <tr key={en}>
                  <th className="border border-border p-2 text-left align-top font-medium">{t(bn, en)}<span className="block text-xs font-normal text-muted-foreground">{time}</span></th>
                  {(plan[r] ?? []).map((cell, i) => (
                    <td key={i} className="border border-border p-2 align-top">
                      <p className="font-bn leading-snug">{cell.bn}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{t(cell.portionBn, cell.portionEn)}</p>
                      <div className="mt-1"><GiTag gi={cell.gi} /></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{t("দিনে ৮–১০ গ্লাস পানি খান। চিনি, মিষ্টি ও কোমল পানীয় বাদ দিন।", "Drink 8–10 glasses of water a day. Skip sugar, sweets and soft drinks.")}</p>
      </main>
      <div className="print:hidden"><SiteFooter /></div>
    </div>
  );
}
