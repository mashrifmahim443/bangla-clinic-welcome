import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { useLang } from "@/lib/i18n";
import { useCms } from "@/lib/cms";
import { formatBDT } from "@/lib/locale";

export const Route = createFileRoute("/subscription")({
  head: () => ({ meta: [
    { title: "Plans and fees in taka — Diacare" },
    { name: "description", content: "Compare Diacare plans: free sugar log, monthly and family plans with doctor consults and SMS check-ins." },
    { property: "og:title", content: "Plans and fees — Diacare" },
    { property: "og:description", content: "A plain comparison of free, monthly and family plans in BDT." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  const { lang, t } = useLang();
  const { c } = useCms();
  const { lines } = useCms();
  const names = lines("pricing.plan_names").map((l) => l[0] ?? "");
  const prices = c("pricing.prices").split(",").map((x) => Number(x.trim().replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))) || 0);
  const plans = [0, 1, 2].map((i) => ({ name: names[i] ?? "", price: prices[i] ?? 0 }));
  const no = "—";
  const rows: [string, string[]][] = lines("sub.rows").map((r) => [r[0] ?? "", [1, 2, 3].map((i) => r[i] ?? no)]);
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold">{c("sub.title")}</h1>
        <p className="mt-2 text-muted-foreground">{c("sub.sub")}</p>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse border border-border bg-card text-left">
            <thead>
              <tr>
                <th className="border border-border p-4" />
                {plans.map((p) => (
                  <th key={p.name} className="border border-border p-4 align-top">
                    <p className="font-display text-xl font-semibold">{p.name}</p>
                    <p className="mt-1 text-2xl font-semibold text-primary">{formatBDT(p.price, lang)}<span className="text-sm font-normal text-muted-foreground"> / {t("মাস", "month")}</span></p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, vals]) => (
                <tr key={label}>
                  <th className="border border-border p-4 font-normal">{label}</th>
                  {vals.map((v, i) => <td key={i} className={`border border-border p-4 ${v === no ? "text-muted-foreground" : ""}`}>{v}</td>)}
                </tr>
              ))}
              <tr>
                <td className="border border-border p-4" />
                {plans.map((p) => (
                  <td key={p.name} className="border border-border p-4">
                    <Link to="/auth" className="inline-block rounded-md border border-primary px-4 py-2 text-primary transition-colors duration-150 hover:bg-secondary">
                      {p.price === 0 ? t("খাতা খুলুন", "Open a diary") : t("এই প্ল্যান নিন", "Choose this plan")}
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
