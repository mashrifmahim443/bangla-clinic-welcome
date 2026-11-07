import { pageHead } from "@/lib/appointments";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka, formatNumber } from "@/lib/locale";
import { dhakaDay } from "@/lib/glucose";
import { TARGETS, checkinRate, completionRate } from "@/lib/targets";

export const Route = createFileRoute("/_authenticated/admin/")({ head: () => pageHead('Admin overview', 'Review DiabeCare patients, consultation totals and clinic targets.'), component: Page });

const axis = { fontSize: 11, fill: "var(--muted-foreground)" };

function Page() {
  const { lang, t } = useLang();
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 864e5).toISOString();
      const [users, appts, reads, docs, links] = await Promise.all([
        supabase.rpc("admin_users"),
        supabase.from("appointments").select("id, doctor_id, slot_start, status"),
        supabase.from("glucose_readings").select("taken_at").gte("taken_at", since),
        supabase.from("doctors").select("id, name_en, name_bn, user_id"),
        supabase.from("checkin_links").select("used_at, expires_at"),
      ]);
      const err = users.error || appts.error || reads.error || docs.error;
      if (err) throw err;
      return { users: users.data ?? [], appts: appts.data ?? [], reads: reads.data ?? [], docs: docs.data ?? [], links: links.data ?? [] };
    },
  });
  const now = Date.now();
  const days = Array.from({ length: 30 }, (_, i) => dhakaDay(new Date(now - (29 - i) * 864e5)));
  const perDay = days.map((d) => ({ d, n: data?.reads.filter((r) => dhakaDay(new Date(r.taken_at)) === d).length ?? 0 }));
  const perDoc = (data?.docs ?? []).map((d) => ({ name: (lang === "bn" ? d.name_bn : d.name_en).replace(/^(Dr\.|ডা\.)\s*/, ""), n: data?.appts.filter((a) => a.doctor_id === d.id).length ?? 0 }));
  const stats: [string, number][] = [
    [t("ব্যবহারকারী", "Users"), data?.users.length ?? 0],
    [t("রোগী", "Patients"), data?.users.filter((u) => u.roles.includes("patient")).length ?? 0],
    [t("অ্যাপয়েন্টমেন্ট (মোট)", "Appointments (total)"), data?.appts.length ?? 0],
    [t("আগামী অ্যাপয়েন্টমেন্ট", "Upcoming appointments"), data?.appts.filter((a) => new Date(a.slot_start).getTime() > now).length ?? 0],
    [t("রিডিং (৩০ দিন)", "Readings (30 days)"), data?.reads.length ?? 0],
  ];
  const dayLabel = (d: string) => formatDhaka(new Date(d + "T12:00:00+06:00"), lang, { day: "numeric", month: "short" });
  const patients = data?.users.filter((u) => u.roles.includes("patient")).length ?? 0;
  const show = (v: number | null, suffix = "") => (v === null ? "—" : formatNumber(v, lang) + suffix);
  const targets: { label: string; target: string; now: string; ok: boolean | null; note?: string }[] = [
    { label: t("যাচাইকৃত ডাক্তার (লগইন যুক্ত)", "Verified doctors (login linked)"), target: formatNumber(TARGETS.doctors, lang) + "+", now: show(data?.docs.filter((d) => d.user_id).length ?? 0), ok: (data?.docs.filter((d) => d.user_id).length ?? 0) >= TARGETS.doctors },
    { label: t("নিবন্ধিত রোগী", "Registered patients"), target: formatNumber(TARGETS.patients, lang) + "+", now: show(patients), ok: patients >= TARGETS.patients },
    { label: t("সাবস্ক্রাইবার রূপান্তর", "Subscriber conversion"), target: formatNumber(TARGETS.conversion, lang) + "%", now: "—", ok: null, note: t("পেমেন্ট চালু হলে গোনা হবে", "Counted once payments are live") },
    { label: t("চেক-ইন রেসপন্স রেট", "Check-in response rate"), target: formatNumber(TARGETS.checkinRate, lang) + "%+", now: show(checkinRate(data?.links ?? []), "%"), ok: (checkinRate(data?.links ?? []) ?? -1) >= TARGETS.checkinRate, note: t("এখন সব রোগী; পেমেন্টের পর শুধু সাবস্ক্রাইবার", "All patients for now; subscribers only after payments") },
    { label: t("কনসালটেশন সম্পন্ন হওয়ার হার", "Consultation completion rate"), target: formatNumber(TARGETS.completionRate, lang) + "%+", now: show(completionRate(data?.appts ?? []), "%"), ok: (completionRate(data?.appts ?? []) ?? -1) >= TARGETS.completionRate },
  ];
  return (
    <div>
      <h1 className="text-lg font-semibold">{t("সারসংক্ষেপ", "Overview")}</h1>
      <h2 className="mt-4 text-[13px] font-medium">{t("৬ মাসের লক্ষ্য", "Six-month targets")}</h2>
      <table className="mt-2 w-full max-w-3xl border-collapse border border-border bg-card text-[13px]">
        <thead><tr className="bg-secondary">
          <th className="border border-border px-2 py-1.5 text-left font-medium">{t("মাপকাঠি", "Metric")}</th>
          <th className="border border-border px-2 py-1.5 text-right font-medium">{t("লক্ষ্য", "Target")}</th>
          <th className="border border-border px-2 py-1.5 text-right font-medium">{t("এখন", "Now")}</th>
          <th className="border border-border px-2 py-1.5 text-left font-medium">{t("মন্তব্য", "Note")}</th>
        </tr></thead>
        <tbody>
          {targets.map((r) => (
            <tr key={r.label}>
              <td className="border border-border px-2 py-1.5">{r.label}</td>
              <td className="border border-border px-2 py-1.5 text-right tabular-nums">{r.target}</td>
              <td className={`border border-border px-2 py-1.5 text-right font-medium tabular-nums ${r.ok === null ? "" : r.ok ? "text-glucose-ok" : "text-glucose-high"}`}>{r.now}</td>
              <td className="border border-border px-2 py-1.5 text-muted-foreground">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="mt-6 text-[13px] font-medium">{t("মোট সংখ্যা", "Totals")}</h2>
      <table className="mt-2 border-collapse border border-border bg-card text-[13px]">
        <tbody>
          <tr>{stats.map(([l]) => <th key={l} className="border border-border bg-secondary px-3 py-1.5 text-left font-medium">{l}</th>)}</tr>
          <tr>{stats.map(([l, v]) => <td key={l} className="border border-border px-3 py-1.5 text-right tabular-nums">{formatNumber(v, lang)}</td>)}</tr>
        </tbody>
      </table>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <figure className="border border-border bg-card p-3">
          <figcaption className="text-[13px] font-medium">{t("প্রতিদিন সুগার রিডিং, গত ৩০ দিন", "Sugar readings per day, last 30 days")}</figcaption>
          <div className="mt-2 h-56">
            <ResponsiveContainer>
              <LineChart data={perDay} margin={{ top: 5, right: 10, bottom: 15, left: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="d" tickFormatter={dayLabel} tick={axis} interval={4} label={{ value: t("তারিখ", "Date"), position: "insideBottom", offset: -8, ...axis }} />
                <YAxis allowDecimals={false} tick={axis} width={36} label={{ value: t("রিডিং", "Readings"), angle: -90, position: "insideLeft", ...axis }} />
                <Tooltip labelFormatter={(d) => dayLabel(String(d))} formatter={(v) => [v, t("রিডিং", "Readings")]} />
                <Line type="monotone" dataKey="n" stroke="var(--primary)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </figure>
        <figure className="border border-border bg-card p-3">
          <figcaption className="text-[13px] font-medium">{t("ডাক্তার অনুযায়ী অ্যাপয়েন্টমেন্ট", "Appointments by doctor")}</figcaption>
          <div className="mt-2 h-56">
            <ResponsiveContainer>
              <BarChart data={perDoc} margin={{ top: 5, right: 10, bottom: 15, left: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={axis} interval={0} />
                <YAxis allowDecimals={false} tick={axis} width={36} label={{ value: t("সংখ্যা", "Count"), angle: -90, position: "insideLeft", ...axis }} />
                <Tooltip formatter={(v) => [v, t("অ্যাপয়েন্টমেন্ট", "Appointments")]} />
                <Bar dataKey="n" fill="var(--primary)" isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </figure>
      </div>
    </div>
  );
}
