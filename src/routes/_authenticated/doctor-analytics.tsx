import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RoleShell } from "@/components/site/role-shell";
import { useLang } from "@/lib/i18n";
import { pageHead } from "@/lib/appointments";
import { formatNumber } from "@/lib/locale";
import { useDoctorAppointments } from "@/lib/doctor-portal";
import { doctorStats } from "@/lib/doctor-stats";

export const Route = createFileRoute("/_authenticated/doctor-analytics")({
  head: () => pageHead("Doctor analytics", "Bookings, cancellation rate and success ratio for your consultations."),
  component: Page,
});

const ym = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit" }).format(new Date(iso)).slice(0, 7);

function Page() {
  const { lang, t } = useLang();
  const { data, isLoading } = useDoctorAppointments();
  const [range, setRange] = useState<"30" | "90" | "all">("all");
  const all = data?.list ?? [];
  const cutoff = range === "all" ? 0 : Date.now() - Number(range) * 86400000;
  const list = all.filter(a => new Date(a.slot_start).getTime() >= cutoff);
  const s = doctorStats(list);
  const n = (v: number) => formatNumber(v, lang);
  const p = (v: number) => `${formatNumber(v, lang)}%`;

  const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() - (5 - i)); return ym(d.toISOString()); });
  const byMonth = months.map(m => { const rows = all.filter(a => ym(a.slot_start) === m); return { m, ...doctorStats(rows) }; });
  const max = Math.max(1, ...byMonth.map(b => b.total));

  const rows: [string, string, string, string][] = [
    ["মোট বুকিং", "Total bookings", n(s.total), ""],
    ["আলাদা রোগী", "Unique patients", n(s.patients), ""],
    ["সম্পন্ন", "Completed", n(s.completed), ""],
    ["বাতিল", "Cancelled", n(s.cancelled), p(s.cancelRate)],
    ["রোগী আসেননি", "No-show", n(s.noShow), p(s.noShowRate)],
    ["অপেক্ষমাণ", "Pending", n(s.pending), ""],
    ["নিশ্চিত (সামনে)", "Confirmed", n(s.confirmed), ""],
  ];

  return (
    <RoleShell role="doctor">
      <h1 className="font-display text-3xl font-semibold">{t("আমার পরিসংখ্যান", "My analytics")}</h1>
      <p className="mt-2 max-w-2xl text-lg">{isLoading ? t("লোড হচ্ছে…", "Loading…") : t(
        `${n(s.total)}টি বুকিং, এর ${p(s.cancelRate)} বাতিল হয়েছে। শেষ হওয়া অ্যাপয়েন্টমেন্টের ${p(s.successRate)} সফলভাবে সম্পন্ন।`,
        `${s.total} bookings, ${s.cancelRate}% cancelled. ${s.successRate}% of finished appointments were completed.`)}</p>

      <div className="mt-4 flex gap-2 text-sm">
        {(["30", "90", "all"] as const).map(r => <button key={r} onClick={() => setRange(r)} className={`rounded-md border px-3 py-1.5 transition-colors duration-150 ${range === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}>
          {r === "all" ? t("সব সময়", "All time") : t(`গত ${n(Number(r))} দিন`, `Last ${r} days`)}</button>)}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-[10px] border border-border bg-card p-5">
          <h2 className="font-display text-xl font-semibold">{t("সাফল্যের হার", "Success ratio")}</h2>
          <p className="mt-1 font-display text-5xl font-semibold text-primary">{p(s.successRate)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("সম্পন্ন ÷ (সম্পন্ন + বাতিল + আসেননি)", "Completed ÷ (completed + cancelled + no-show)")}</p>
          <div className="mt-4 flex h-3 overflow-hidden rounded-sm border border-border" aria-hidden>
            <div className="bg-primary" style={{ width: `${s.total ? (s.completed / s.total) * 100 : 0}%` }} />
            <div className="bg-accent" style={{ width: `${s.cancelRate}%` }} />
            <div className="bg-muted-foreground" style={{ width: `${s.noShowRate}%` }} />
          </div>
          <ul className="mt-2 flex flex-wrap gap-4 text-sm">
            <li><span className="mr-1 inline-block size-2.5 bg-primary" />{t("সম্পন্ন", "Completed")}</li>
            <li><span className="mr-1 inline-block size-2.5 bg-accent" />{t("বাতিল", "Cancelled")}</li>
            <li><span className="mr-1 inline-block size-2.5 bg-muted-foreground" />{t("আসেননি", "No-show")}</li>
          </ul>
        </section>
        <section className="rounded-[10px] border border-border bg-card">
          <table className="w-full text-left text-sm"><tbody>
            {rows.map(([bn, en, v, pc]) => <tr key={en} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5">{t(bn, en)}</td><td className="px-4 py-2.5 text-right font-semibold">{v}</td><td className="w-20 px-4 py-2.5 text-right text-muted-foreground">{pc}</td></tr>)}
          </tbody></table>
        </section>
      </div>

      <section className="mt-6 rounded-[10px] border border-border bg-card p-5">
        <h2 className="font-display text-xl font-semibold">{t("গত ৬ মাসের বুকিং", "Bookings, last 6 months")}</h2>
        <div className="mt-4 space-y-2">{byMonth.map(b => <div key={b.m} className="grid grid-cols-[5rem_1fr_7rem] items-center gap-3 text-sm">
          <span className="text-muted-foreground">{b.m}</span>
          <div className="h-5 border-l border-border"><div className="h-full bg-primary" style={{ width: `${(b.total / max) * 100}%` }} /></div>
          <span>{n(b.total)} · {t("বাতিল", "cancel")} {p(b.cancelRate)}</span></div>)}</div>
      </section>
    </RoleShell>
  );
}
