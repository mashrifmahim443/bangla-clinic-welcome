import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { useLang } from "@/lib/i18n";
import { formatBDT, formatDhaka } from "@/lib/locale";
import { StatusDot, doctorPhotos, specialties, statusInfo } from "@/lib/doctors";
import { upcomingDays } from "@/lib/slots";

export const Route = createFileRoute("/doctors/$slug")({
  head: () => ({
    meta: [
      { title: "Book a consultation — DiabeCare" },
      { name: "description", content: "Pick a time and book an online diabetes consultation with a BMDC-registered doctor." },
      { property: "og:title", content: "Book a consultation — DiabeCare" },
      { property: "og:description", content: "Pick a time with a BMDC-registered doctor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookingPage,
});

function BookingPage() {
  const { slug } = Route.useParams();
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const days = useMemo(() => (now ? upcomingDays(now) : []), [now]);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const day = days.find((d) => d.key === dayKey) ?? days[0];

  const { data: doctor, isLoading } = useQuery({
    queryKey: ["doctor", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("doctors").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: session } = useQuery({
    queryKey: ["session-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });

  const range = days.length ? [days[0]!.slots[0] ?? days[0]!.date, days[days.length - 1]!.date] : null;
  const { data: booked = [] } = useQuery({
    queryKey: ["booked", doctor?.id, range?.[0]?.toISOString()],
    enabled: !!doctor && !!range,
    queryFn: async () => {
      const to = new Date(range![1].getTime() + 864e5).toISOString();
      const { data, error } = await supabase.rpc("booked_slots", { _doctor: doctor!.id, _from: new Date(0).toISOString(), _to: to });
      if (error) throw error;
      return (data as string[]).map((s) => new Date(s).getTime());
    },
  });

  const book = useMutation({
    mutationFn: async (slotIso: string) => {
      const { error } = await supabase.from("appointments").insert({ doctor_id: doctor!.id, slot_start: slotIso, patient_id: session!.id });
      if (error) throw error;
    },
    onSuccess: (_d, slotIso) => {
      setMsg({ kind: "ok", text: t(`বুক হয়েছে: ${formatDhaka(new Date(slotIso), "bn", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}। ডাক্তার সেই সময় ফোন বা ভিডিওতে যোগ দেবেন।`, `Booked for ${formatDhaka(new Date(slotIso), "en", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}. The doctor will join by phone or video then.`) });
      setPicked(null);
      qc.invalidateQueries({ queryKey: ["booked"] });
    },
    onError: (e: { code?: string }) =>
      setMsg({ kind: "err", text: e.code === "23505" ? t("এই সময়টা এইমাত্র অন্য কেউ নিয়েছেন। আরেকটা বেছে নিন।", "Someone just took this time. Please pick another.") : t("বুক করা গেল না। আবার চেষ্টা করুন।", "Couldn't book. Please try again.") }),
  });

  if (isLoading) return <Shell><p className="text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p></Shell>;
  if (!doctor) return <Shell><p>{t("এই ডাক্তারকে পাওয়া গেল না।", "Doctor not found.")} <Link to="/doctors" className="text-primary underline">{t("তালিকায় ফিরুন", "Back to list")}</Link></p></Shell>;

  return (
    <Shell>
      <Link to="/doctors" className="text-sm text-primary underline underline-offset-4">← {t("সব ডাক্তার", "All doctors")}</Link>
      <div className="mt-5 flex flex-wrap items-start gap-5 border-b border-border pb-6">
        <img src={doctorPhotos[doctor.slug]} alt="" width={96} height={96} className="h-24 w-24 rounded-md border border-border object-cover" />
        <div className="flex-1">
          <h1 className="font-display text-3xl font-semibold">{lang === "bn" ? doctor.name_bn : doctor.name_en}</h1>
          <p className="text-muted-foreground">{doctor.degrees}</p>
          <p className="mt-1 text-sm">
            {t(...(specialties[doctor.specialty] ?? [doctor.specialty, doctor.specialty]))} · BMDC <span className="font-mono">{doctor.bmdc_no}</span> · {formatBDT(doctor.fee_bdt, lang)}
          </p>
        </div>
        <StatusDot status={doctor.status} label={t(statusInfo[doctor.status].bn, statusInfo[doctor.status].en)} />
      </div>

      <h2 className="mt-8 text-xl font-semibold">{t("দিন বেছে নিন", "Pick a day")}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {days.map((d) => (
          <button key={d.key} onClick={() => { setDayKey(d.key); setPicked(null); setMsg(null); }}
            className={`rounded-md border px-3 py-2 text-sm ${d.key === day?.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}>
            {formatDhaka(d.date, lang, { weekday: "short", day: "numeric", month: "short" })}
          </button>
        ))}
      </div>

      <h2 className="mt-8 text-xl font-semibold">{t("সময় বেছে নিন", "Pick a time")} <span className="text-sm font-normal text-muted-foreground">({t("ঢাকার সময়", "Dhaka time")})</span></h2>
      {day && day.slots.length === 0 && <p className="mt-3 text-muted-foreground">{t("এই দিনে আর কোনো সময় খালি নেই।", "No times left on this day.")}</p>}
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {day?.slots.map((s) => {
          const iso = s.toISOString();
          const taken = booked.includes(s.getTime());
          const sel = picked === iso;
          return (
            <button key={iso} disabled={taken} onClick={() => { setPicked(iso); setMsg(null); }}
              className={`rounded-md border py-2.5 text-center ${taken ? "cursor-not-allowed border-border bg-secondary text-muted-foreground line-through" : sel ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}
              aria-pressed={sel}>
              {formatDhaka(s, lang, { hour: "numeric", minute: "2-digit" })}
            </button>
          );
        })}
      </div>

      <div className="mt-8 border-t border-border pt-6">
        {msg && <p className={`mb-4 rounded-md border px-3 py-2 ${msg.kind === "ok" ? "border-glucose-ok text-glucose-ok" : "border-destructive text-destructive"}`}>{msg.text}</p>}
        {!session ? (
          <p>{t("সময় বুক করতে আগে", "To book, first")} <Link to="/auth" className="font-medium text-primary underline underline-offset-4">{t("ঢুকুন", "sign in")}</Link>{t("।", ".")}</p>
        ) : (
          <button disabled={!picked || book.isPending} onClick={() => picked && book.mutate(picked)}
            className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {picked
              ? t(`${formatDhaka(new Date(picked), "bn", { hour: "numeric", minute: "2-digit" })}-এ বুক করুন · ${formatBDT(doctor.fee_bdt, "bn")}`, `Book ${formatDhaka(new Date(picked), "en", { hour: "numeric", minute: "2-digit" })} · ${formatBDT(doctor.fee_bdt, "en")}`)
              : t("আগে একটা সময় বেছে নিন", "Pick a time first")}
          </button>
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
