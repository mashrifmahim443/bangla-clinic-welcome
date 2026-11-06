import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { useLang } from "@/lib/i18n";
import { formatBDT } from "@/lib/locale";

export const Route = createFileRoute("/subscription")({
  head: () => ({ meta: [
    { title: "Plans and fees in taka — DiabeCare" },
    { name: "description", content: "Compare DiabeCare plans: free sugar log, monthly and family plans with doctor consults and SMS check-ins." },
    { property: "og:title", content: "Plans and fees — DiabeCare" },
    { property: "og:description", content: "A plain comparison of free, monthly and family plans in BDT." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  const { lang, t } = useLang();
  const plans = [
    { name: t("বিনামূল্যে", "Free"), price: 0 },
    { name: t("মাসিক", "Monthly"), price: 499 },
    { name: t("পরিবার", "Family"), price: 1199 },
  ];
  const yes = t("আছে", "Yes"), no = "—";
  const rows: [string, string[]][] = [
    [t("সুগারের খাতা ও চার্ট", "Sugar diary and chart"), [yes, yes, yes]],
    [t("এসএমএস/হোয়াটসঅ্যাপ চেক-ইন", "SMS / WhatsApp check-ins"), [no, t("দিনে ৩ বার", "3 a day"), t("দিনে ৩ বার", "3 a day")]],
    [t("ডাক্তারের পরামর্শ", "Doctor consults"), [no, t("মাসে ১ বার", "1 a month"), t("মাসে ৩ বার", "3 a month")]],
    [t("সাপ্তাহিক খাদ্য তালিকা", "Weekly diet chart"), [t("সাধারণ", "General"), t("ব্যক্তিগত", "Personal"), t("ব্যক্তিগত", "Personal")]],
    [t("প্রিন্টযোগ্য প্রেসক্রিপশন", "Printable prescription"), [no, yes, yes]],
    [t("কতজন", "People"), ["১ জন", "১ জন", t("৪ জন পর্যন্ত", "Up to 4")].map((v, i) => (lang === "en" ? ["1", "1", "Up to 4"][i]! : v))],
  ];
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold">{t("প্ল্যান ও ফি", "Plans and fees")}</h1>
        <p className="mt-2 text-muted-foreground">{t("যেকোনো সময় বাদ দিতে পারবেন। বিকাশ ও নগদে ফি দেওয়া যাবে।", "Cancel any time. Pay by bKash or Nagad.")}</p>
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
