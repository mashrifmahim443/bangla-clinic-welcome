import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppointmentList } from "@/components/consult/appointment-list";
import { RoleShell } from "@/components/site/role-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { pageHead, consultationLabels, useAppointmentRealtime } from "@/lib/appointments";
import { dhakaNowParts, formatDhaka, formatNumber } from "@/lib/locale";
import { useDoctorAppointments, type DoctorAppt } from "@/lib/doctor-portal";

export const Route = createFileRoute("/_authenticated/doctor")({
  head: () => pageHead("Doctor appointments", "Accept, reschedule and manage your patient consultations."),
  component: Page,
});

const dhakaDate = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date(iso));

function Page() {
  const { lang, t } = useLang();
  useAppointmentRealtime();
  const qc = useQueryClient();
  const { data, isLoading } = useDoctorAppointments();
  const [busy, setBusy] = useState(""); const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const list = data?.list ?? [];
  const today = dhakaNowParts().date;
  const pending = list.filter(a => a.status === "pending").sort((a, b) => a.slot_start.localeCompare(b.slot_start));
  const todays = list.filter(a => a.status === "confirmed" && dhakaDate(a.slot_start) === today).sort((a, b) => a.slot_start.localeCompare(b.slot_start));
  const upcoming = list.filter(a => a.status === "confirmed" && new Date(a.slot_start).getTime() > Date.now()).length;

  async function change(a: DoctorAppt, status: "confirmed" | "cancelled") {
    let reason = "";
    if (status === "cancelled") { const r = prompt(t("বাতিলের কারণ লিখুন", "Enter cancellation reason")); if (r === null) return; reason = r; }
    setBusy(a.id); setMsg(null);
    const { error } = await supabase.rpc("change_appointment", { _id: a.id, _status: status, _reason: reason });
    setBusy("");
    if (error) setMsg({ ok: false, text: error.message });
    else { setMsg({ ok: true, text: status === "confirmed" ? t(`${a.patientName ?? "রোগী"}-এর অ্যাপয়েন্টমেন্ট গ্রহণ করা হয়েছে।`, `Accepted ${a.patientName ?? "the patient"}'s appointment.`) : t("অ্যাপয়েন্টমেন্ট বাতিল হয়েছে।", "Appointment cancelled.") }); void qc.invalidateQueries({ queryKey: ["appointments"] }); }
  }

  return (
    <RoleShell role="doctor">
      <p className="text-sm text-muted-foreground">{formatDhaka(new Date(), lang, { dateStyle: "full" })}</p>
      <h1 className="font-display text-3xl font-semibold">{t("আজকের কাজ", "Today's work")}</h1>
      <p className="mt-2 max-w-2xl text-lg">
        {isLoading ? t("লোড হচ্ছে…", "Loading…") : t(
          `${formatNumber(pending.length, lang)}টি অনুরোধ আপনার উত্তরের অপেক্ষায়, আজ ${formatNumber(todays.length, lang)}জন রোগী দেখবেন, সামনে মোট ${formatNumber(upcoming, lang)}টি নিশ্চিত অ্যাপয়েন্টমেন্ট।`,
          `${pending.length} requests waiting for you, ${todays.length} patients today, ${upcoming} confirmed appointments ahead.`)}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild className="shadow-none"><Link to="/doctor-messages" search={{ a: undefined }}>{t("রোগীদের বার্তা দেখুন", "Open patient messages")}</Link></Button>
        <Button asChild variant="outline" className="shadow-none"><Link to="/doctor-schedule">{t("সময়সূচি ঠিক করুন", "Set schedule")}</Link></Button>
      </div>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mt-4 border-l-2 pl-3 ${msg.ok ? "border-primary" : "border-destructive text-destructive"}`}>{msg.text}</p>}

      <section className="mt-8">
        <h2 className="flex items-baseline gap-2 font-display text-xl font-semibold">{t("অপেক্ষমাণ অনুরোধ", "Pending requests")}<span className="rounded-md bg-accent px-2 text-sm text-accent-foreground">{formatNumber(pending.length, lang)}</span></h2>
        {!isLoading && !pending.length && <p className="mt-2 text-muted-foreground">{t("এখন কোনো অনুরোধ অপেক্ষায় নেই।", "No requests waiting right now.")}</p>}
        {pending.length > 0 && <div className="mt-3 overflow-x-auto rounded-[10px] border border-border bg-card">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border bg-secondary text-muted-foreground"><tr>
              <th className="px-4 py-2 font-medium">{t("রোগী", "Patient")}</th><th className="px-4 py-2 font-medium">{t("সময়", "Time")}</th><th className="px-4 py-2 font-medium">{t("সমস্যা", "Problem")}</th><th className="px-4 py-2 font-medium">{t("কাজ", "Action")}</th></tr></thead>
            <tbody>{pending.map(a => <tr key={a.id} className="border-b border-border last:border-0 align-top">
              <td className="px-4 py-3"><p className="font-semibold">{a.patientName || t("রোগী", "Patient")}</p><p className="text-muted-foreground">{t(...(consultationLabels[a.consultation_type] ?? [a.consultation_type, a.consultation_type]))}</p></td>
              <td className="px-4 py-3 whitespace-nowrap">{formatDhaka(new Date(a.slot_start), lang)}</td>
              <td className="max-w-xs px-4 py-3"><p className="line-clamp-3 whitespace-pre-wrap">{a.reason || "—"}</p><Link to="/patient-history/$id" params={{ id: a.id }} className="text-primary underline underline-offset-4">{t("ইতিহাস", "History")}</Link></td>
              <td className="px-4 py-3"><div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={busy === a.id} className="shadow-none" onClick={() => change(a, "confirmed")}>{t("গ্রহণ করুন", "Accept")}</Button>
                <Button size="sm" variant="outline" disabled={busy === a.id} className="shadow-none" onClick={() => change(a, "cancelled")}>{t("বাতিল", "Decline")}</Button>
              </div></td>
            </tr>)}</tbody>
          </table>
        </div>}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">{t("আজকের রোগী", "Today's patients")}</h2>
        {!isLoading && !todays.length && <p className="mt-2 text-muted-foreground">{t("আজ কোনো নিশ্চিত অ্যাপয়েন্টমেন্ট নেই।", "No confirmed appointments today.")}</p>}
        <ul className="mt-3 divide-y divide-border border-y border-border">{todays.map(a => <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div><span className="font-display text-lg font-semibold">{formatDhaka(new Date(a.slot_start), lang, { timeStyle: "short" })}</span><span className="ml-3 font-medium">{a.patientName || t("রোগী", "Patient")}</span><p className="text-sm text-muted-foreground">{a.reason}</p></div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Button asChild size="sm" className="shadow-none"><Link to="/consult/$id" params={{ id: a.id }}>{t("কক্ষে যান", "Enter room")}</Link></Button>
            <Button asChild size="sm" variant="outline" className="shadow-none"><Link to="/rx-write/$id" params={{ id: a.id }}>{t("প্রেসক্রিপশন লিখুন", "Write prescription")}</Link></Button>
          </div></li>)}</ul>
      </section>

      <details className="mt-8 border-t border-border pt-4">
        <summary className="cursor-pointer font-display text-xl font-semibold">{t("সব অ্যাপয়েন্টমেন্ট", "All appointments")}</summary>
        <AppointmentList as="doctor" />
      </details>
    </RoleShell>
  );
}
