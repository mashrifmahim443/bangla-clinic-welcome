import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { useLang } from "@/lib/i18n";
import { formatBDT } from "@/lib/locale";
import { StatusDot, doctorPhotos, specialties, statusInfo } from "@/lib/doctors";

export const Route = createFileRoute("/doctors/")({
  head: () => ({
    meta: [
      { title: "Diabetes doctors in Bangladesh — DiabeCare" },
      { name: "description", content: "BMDC-registered diabetes doctors, endocrinologists and nutritionists. See fees in taka and book an online consultation." },
      { property: "og:title", content: "Diabetes doctors — DiabeCare" },
      { property: "og:description", content: "BMDC-registered doctors with fees in taka. Book online." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DoctorsPage,
});

export function useDoctors() {
  return useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("doctors").select("*").order("fee_bdt");
      if (error) throw error;
      return data;
    },
  });
}

const feeBands = [
  { key: "lt600", bn: "৳৬০০-এর কম", en: "Under ৳600", test: (f: number) => f < 600 },
  { key: "600to800", bn: "৳৬০০–৳৮০০", en: "৳600–৳800", test: (f: number) => f >= 600 && f <= 800 },
  { key: "gt800", bn: "৳৮০০-এর বেশি", en: "Over ৳800", test: (f: number) => f > 800 },
];

function DoctorsPage() {
  const { lang, t } = useLang();
  const { data: doctors = [], isLoading } = useDoctors();
  const [spec, setSpec] = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [fee, setFee] = useState<string[]>([]);
  const [gender, setGender] = useState<string[]>([]);

  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const shown = doctors.filter(
    (d) =>
      (!spec.length || spec.includes(d.specialty)) &&
      (!status.length || status.includes(d.status)) &&
      (!gender.length || gender.includes(d.gender)) &&
      (!fee.length || feeBands.some((b) => fee.includes(b.key) && b.test(d.fee_bdt))),
  );

  const group = (title: string, items: { v: string; label: string }[], list: string[], set: (v: string[]) => void) => (
    <fieldset className="border-b border-border py-4 first:pt-0">
      <legend className="mb-2 font-semibold">{title}</legend>
      {items.map((i) => (
        <label key={i.v} className="flex cursor-pointer items-center gap-2.5 py-1">
          <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={list.includes(i.v)} onChange={() => toggle(list, set, i.v)} />
          {i.label}
        </label>
      ))}
    </fieldset>
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold">{t("ডাক্তার খুঁজুন", "Find a doctor")}</h1>
        <p className="mt-1 text-muted-foreground">{t("সবাই BMDC নিবন্ধিত। নিবন্ধন নম্বর পাশে দেওয়া আছে।", "All are BMDC registered. The number is shown beside each name.")}</p>

        <div className="mt-8 grid gap-10 md:grid-cols-[13rem_1fr]">
          <aside aria-label={t("ছাঁকনি", "Filters")}>
            {group(t("বিশেষত্ব", "Specialty"), Object.entries(specialties).map(([v, l]) => ({ v, label: t(...l) })), spec, setSpec)}
            {group(t("অবস্থা", "Status"), (["online", "busy", "offline"] as const).map((v) => ({ v, label: t(statusInfo[v].bn, statusInfo[v].en) })), status, setStatus)}
            {group(t("ফি", "Fee"), feeBands.map((b) => ({ v: b.key, label: t(b.bn, b.en) })), fee, setFee)}
            {group(t("ডাক্তার", "Doctor"), [{ v: "female", label: t("মহিলা", "Female") }, { v: "male", label: t("পুরুষ", "Male") }], gender, setGender)}
            {(spec.length || status.length || fee.length || gender.length) > 0 && (
              <button onClick={() => { setSpec([]); setStatus([]); setFee([]); setGender([]); }} className="mt-4 text-sm text-primary underline underline-offset-4">
                {t("সব মুছুন", "Clear all")}
              </button>
            )}
          </aside>

          <section>
            <p className="mb-3 text-sm text-muted-foreground">{t(`${shown.length.toLocaleString("bn-BD")} জন ডাক্তার`, `${shown.length} doctors`)}</p>
            <div className="overflow-x-auto border-t border-foreground/80">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-border text-sm text-muted-foreground">
                  <tr>
                    <th className="py-2.5 pr-3 font-normal" />
                    <th className="py-2.5 pr-3 font-normal">{t("নাম ও ডিগ্রি", "Name & degrees")}</th>
                    <th className="py-2.5 pr-3 font-normal">{t("বিশেষত্ব", "Specialty")}</th>
                    <th className="py-2.5 pr-3 font-normal">BMDC</th>
                    <th className="py-2.5 pr-3 font-normal">{t("ফি", "Fee")}</th>
                    <th className="py-2.5 pr-3 font-normal">{t("অবস্থা", "Status")}</th>
                    <th className="py-2.5 font-normal" />
                  </tr>
                </thead>
                <tbody>
                  {isLoading && <tr><td colSpan={7} className="py-6 text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</td></tr>}
                  {!isLoading && shown.length === 0 && <tr><td colSpan={7} className="py-6 text-muted-foreground">{t("এই বাছাইয়ে কোনো ডাক্তার মিলল না।", "No doctors match these filters.")}</td></tr>}
                  {shown.map((d) => (
                    <tr key={d.id} className="border-b border-border align-middle">
                      <td className="py-3 pr-3">
                        <img src={doctorPhotos[d.slug]} alt="" width={56} height={56} loading="lazy" className="h-14 w-14 rounded-md border border-border object-cover" />
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-semibold">{lang === "bn" ? d.name_bn : d.name_en}</p>
                        <p className="text-sm text-muted-foreground">{d.degrees}</p>
                      </td>
                      <td className="py-3 pr-3">{t(...(specialties[d.specialty] ?? [d.specialty, d.specialty]))}</td>
                      <td className="py-3 pr-3 font-mono text-sm">{d.bmdc_no}</td>
                      <td className="py-3 pr-3 whitespace-nowrap">{formatBDT(d.fee_bdt, lang)}</td>
                      <td className="py-3 pr-3"><StatusDot status={d.status} label={t(statusInfo[d.status].bn, statusInfo[d.status].en)} /></td>
                      <td className="py-3 text-right">
                        <Link to="/doctors/$slug" params={{ slug: d.slug }} className="whitespace-nowrap rounded-md border border-primary px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground">
                          {t("সময় নিন", "Book")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
