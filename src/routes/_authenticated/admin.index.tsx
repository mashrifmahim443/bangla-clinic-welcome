import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka, formatNumber } from "@/lib/locale";
import { dhakaDay } from "@/lib/glucose";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Page });

const axis = { fontSize: 11, fill: "var(--muted-foreground)" };

function Page() {
  const { lang, t } = useLang();
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 864e5).toISOString();
      const [users, appts, reads, docs] = await Promise.all([
        supabase.rpc("admin_users"),
        supabase.from("appointments").select("id, doctor_id, slot_start, status"),
        supabase.from("glucose_readings").select("taken_at").gte("taken_at", since),
        supabase.from("doctors").select("id, name_en, name_bn"),
      ]);
      const err = users.error || appts.error || reads.error || docs.error;
      if (err) throw err;
      return { users: users.data ?? [], appts: appts.data ?? [], reads: reads.data ?? [], docs: docs.data ?? [] };
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
  return (
    <div>
      <h1 className="text-lg font-semibold">{t("সারসংক্ষেপ", "Overview")}</h1>
      <table className="mt-3 border-collapse border border-border bg-card text-[13px]">
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
