import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { useLang } from "@/lib/i18n";
import { formatBDT, formatNumber } from "@/lib/locale";
import { UNIT, formatGlucose } from "@/lib/glucose";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import heroImg from "@/assets/hero-sugar-check.jpg";
import { useCms } from "@/lib/cms";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { doctorPhotos, specialties } from "@/lib/doctors";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DiabeCare — Log your sugar, tell your doctor" },
      { name: "description", content: "Diabetes care for Bangladesh: log sugar three times a day, see BMDC-verified doctors online, and get food lists in Bangla." },
      { property: "og:title", content: "DiabeCare — Log your sugar, tell your doctor" },
      { property: "og:description", content: "Log sugar, see BMDC-verified doctors, and get Bangla food lists. Built in Dhaka." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});



function Landing() {
  const { lang, t } = useLang();
  const { c, lines, img } = useCms();
  const { data: doctors = [] } = useQuery({
    queryKey: ["home-doctors"],
    queryFn: async () => {
      const { data } = await supabase.from("doctors").select("id, slug, name_bn, name_en, specialty, fee_bdt, status, photo_url").eq("active", true).order("status").limit(4);
      return data ?? [];
    },
  });
  const eat = lines("food.eat").map((l) => l[0]!);
  const avoid = lines("food.avoid").map((l) => l[0]!);
  const prices = c("pricing.prices").split(",").map((x) => Number(x.trim().replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))) || 0);

  const steps = lines("how.steps");

  const faqs = lines("faq.items");

  const planNames = lines("pricing.plan_names").map((l) => l[0] ?? "");
  const priceRows = lines("pricing.rows");
  const plans = [0, 1, 2].map((i) => ({ name: planNames[i] ?? "", price: prices[i] ?? 0, rows: priceRows.map((r) => r[i + 1] ?? "—") }));
  const planLabels = priceRows.map((r) => r[0] ?? "");

  return (
    <div className="min-h-screen overflow-x-hidden">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pt-14 pb-20 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="font-display text-[2.6rem] font-semibold leading-tight text-foreground md:text-[3.4rem]">
            <>{c("hero.line1")}<br />{c("hero.l2_before")}<span className="hand-underline">{c("hero.l2_word")}</span>{c("hero.l2_after")}</>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            {c("hero.sub")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <Link to="/auth" className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90">
              {c("hero.cta")}
            </Link>
            <a href="#how" className="font-medium text-primary underline underline-offset-4 hover:text-accent">
              {t("কীভাবে কাজ করে", "How it works")}
            </a>
          </div>
        </div>
        <div className="relative md:-mr-16 md:translate-y-4">
          <img
            src={img("hero.image", heroImg)}
            alt={t("খাবার টেবিলে বসে সুগার মাপছেন একজন মানুষ", "A man checking his sugar at the dining table")}
            width={1024}
            height={1280}
            className="aspect-[4/5] w-full rounded-[10px] border border-border object-cover"
          />
          <div className="absolute -bottom-6 -left-6 w-52 -rotate-2 rounded-md border border-border bg-card px-4 py-3">
            <p className="font-hand text-xl leading-tight text-muted-foreground">{c("hero.note_title")}</p>
            <p className="font-display text-3xl font-semibold text-glucose-ok">
              {formatGlucose(6.2, lang)} <span className="font-sans text-sm font-normal text-muted-foreground">{UNIT}</span>
            </p>
            <p className="text-xs text-muted-foreground">{c("hero.note_sub")}</p>
          </div>
        </div>
      </section>

      {/* Strip */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl divide-border px-6 md:grid-cols-3 md:divide-x">
          {lines("strip.items").map(([big, small]) => (
            <div key={small} className="py-8 md:px-8 first:md:pl-0">
              <p className="font-display text-4xl font-semibold text-primary">{big}</p>
              <p className="mt-1 text-muted-foreground">{small}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[1fr_2fr]">
        <h2 className="font-display text-4xl font-semibold">{c("how.title")}</h2>
        <ol className="divide-y divide-border">
          {steps.map(([title, body], i) => (
            <li key={i} className="flex gap-8 py-6 first:pt-0">
              <span className="font-display w-14 shrink-0 text-6xl font-semibold leading-none text-accent">
                {formatNumber(i + 1, lang)}
              </span>
              <div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-1 text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Doctors */}
      <section id="doctors" className="border-t border-border bg-secondary">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-4xl font-semibold">{c("doctors.title")}</h2>
            <Link to="/doctors" className="font-medium text-primary underline underline-offset-4">{c("doctors.see_all")}</Link>
          </div>
          <div className="mt-6">
            <Link
              to="/doctor-apply"
              className="inline-block rounded-md border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors duration-150 hover:bg-primary hover:text-primary-foreground"
            >
              {c("doctors.join_btn")}
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              {c("doctors.join_note")}
            </p>
          </div>
          <div className="mt-8 overflow-hidden rounded-[10px] border border-border bg-card">
            <div className="hidden grid-cols-[3.5rem_2fr_1.5fr_1fr_1fr] gap-4 border-b border-border px-5 py-3 text-sm text-muted-foreground md:grid">
              <span />
              <span>{t("নাম", "Name")}</span>
              <span>{t("বিশেষত্ব", "Specialty")}</span>
              <span>{t("ফি", "Fee")}</span>
              <span>{t("অবস্থা", "Status")}</span>
            </div>
            {doctors.map((d) => {
              const photo = d.photo_url || doctorPhotos[d.slug];
              const spec = specialties[d.specialty];
              return (
              <Link key={d.id} to="/doctors/$slug" params={{ slug: d.slug }} className="grid grid-cols-[3.5rem_1fr] items-center gap-x-4 gap-y-1 border-b border-border px-5 py-4 transition-colors duration-150 last:border-0 hover:bg-secondary md:grid-cols-[3.5rem_2fr_1.5fr_1fr_1fr]">
                {photo ? <img src={photo} alt="" className="row-span-3 h-12 w-12 rounded-md border border-border object-cover md:row-span-1" /> : <div className="row-span-3 flex h-12 w-12 items-center justify-center rounded-md bg-secondary font-semibold text-primary md:row-span-1">{d.name_bn.replace("ডা. ", "").slice(0, 2)}</div>}
                <p className="font-semibold">{t(d.name_bn, d.name_en)}</p>
                <p className="text-muted-foreground">{spec ? t(spec[0], spec[1]) : d.specialty}</p>
                <p>{formatBDT(d.fee_bdt, lang)}</p>
                <p className="flex items-center gap-2 text-sm">
                  <span className={`h-2.5 w-2.5 rounded-full ${d.status === "online" ? "bg-glucose-ok" : d.status === "busy" ? "bg-glucose-high" : "bg-border"}`} />
                  {d.status === "online" ? t("এখন অনলাইনে", "Online now") : d.status === "busy" ? t("ব্যস্ত", "Busy") : t("অফলাইন", "Offline")}
                </p>
              </Link>
            );})}
          </div>
        </div>
      </section>

      {/* Food */}
      <section id="food" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-4xl font-semibold">{c("food.title")}</h2>
        <p className="mt-2 max-w-lg text-muted-foreground">{c("food.sub")}</p>
        <div className="mt-10 grid gap-12 md:grid-cols-2">
          {[
            { title: c("food.eat_title"), list: eat, color: "text-glucose-ok" },
            { title: c("food.avoid_title"), list: avoid, color: "text-glucose-low" },
          ].map((col) => (
            <div key={col.title}>
              <h3 className={`border-b-2 border-current pb-2 text-2xl font-semibold ${col.color}`}>{col.title}</h3>
              <ul className="divide-y divide-border">
                {col.list.map((item, i) => (
                  <li key={i} className="py-3">{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-4xl font-semibold">{c("pricing.title")}</h2>
          <p className="mt-2 text-muted-foreground">{c("pricing.sub")}</p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[540px] border border-border bg-card text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 font-normal text-muted-foreground" />
                  {plans.map((p) => (
                    <th key={p.name} className="p-4 align-bottom">
                      <span className="block text-lg font-semibold">{p.name}</span>
                      <span className="font-display text-2xl font-semibold text-primary">{formatBDT(p.price ?? 0, lang)}</span>
                      <span className="text-sm font-normal text-muted-foreground"> / {t("মাস", "month")}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {planLabels.map((label, r) => (
                  <tr key={label} className="border-b border-border last:border-0">
                    <td className="p-4 text-muted-foreground">{label}</td>
                    {plans.map((p) => {
                      const v = p.rows[r];
                      const text = v ?? "—";
                      return <td key={p.name} className="p-4">{text}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto grid max-w-6xl gap-10 px-6 pb-24 md:grid-cols-[1fr_2fr]">
        <h2 className="font-display text-4xl font-semibold">{c("faq.title")}</h2>
        <Accordion type="single" collapsible className="border-t border-border">
          {faqs.map(([q, a], i) => (
            <AccordionItem key={i} value={`q${i}`} className="border-border">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline">{q}</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <SiteFooter />
    </div>
  );
}
