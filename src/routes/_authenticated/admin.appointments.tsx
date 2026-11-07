import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { appointmentLabels, flatButton, pageHead, useAppointmentRealtime } from "@/lib/appointments";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatBDT, formatDhaka } from "@/lib/locale";
import { SortableTable, type Col } from "@/components/admin/sortable-table";

export const Route = createFileRoute("/_authenticated/admin/appointments")({ head: () => pageHead("Admin appointments", "Manage appointment records and cancellation refund decisions."), component: Page });

function Page() {
  const { lang, t } = useLang();
  const qc = useQueryClient(); useAppointmentRealtime();
  const [msg, setMsg] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-appts"],
    queryFn: async () => {
      const [a, p] = await Promise.all([
        supabase.from("appointments").select("id, slot_start, status, patient_id, refund_decision, refund_note, cancellation_reason, doctors(name_bn, name_en, fee_bdt)").order("slot_start", { ascending: false }),
        supabase.from("profiles").select("id, full_name"),
      ]);
      if (a.error) throw a.error;
      const names = new Map((p.data ?? []).map((x) => [x.id, x.full_name]));
      return (a.data ?? []).map((x) => ({ ...x, patient: names.get(x.patient_id) ?? "—" }));
    },
  });
  type A = (typeof data)[number];
  const cols: Col<A>[] = [
    { key: "time", label: t("সময়", "Time"), value: (a) => a.slot_start, render: (a) => formatDhaka(new Date(a.slot_start), lang) },
    { key: "patient", label: t("রোগী", "Patient"), value: (a) => a.patient },
    { key: "doctor", label: t("ডাক্তার", "Doctor"), value: (a) => (lang === "bn" ? a.doctors?.name_bn : a.doctors?.name_en) ?? "" },
    { key: "fee", label: t("ফি", "Fee"), value: (a) => a.doctors?.fee_bdt ?? 0, render: (a) => formatBDT(a.doctors?.fee_bdt ?? 0, lang), align: "right" },
    { key: "status", label: t("অবস্থা", "Status"), value: (a) => a.status, render: a => t(...(appointmentLabels[a.status] ?? [a.status,a.status])) },
    { key: "refund", label: t("ফেরতের সিদ্ধান্ত", "Refund decision"), value: a => a.refund_decision ?? "", render: a => <div><p>{a.refund_decision ? t(...(appointmentLabels[a.refund_decision] ?? [a.refund_decision,a.refund_decision])) : "—"}</p><p>{a.cancellation_reason}</p><p>{a.refund_note}</p>{a.refund_decision === "admin_review" && <div className="mt-2 flex flex-wrap gap-2">{[true,false].map(approve => <Button key={String(approve)} variant="outline" className={flatButton} onClick={async () => { const note = prompt(t("সিদ্ধান্তের কারণ লিখুন", "Enter decision reason")); if (note === null) return; const { error } = await supabase.rpc("review_appointment_refund", { _id:a.id, _approve:approve, _note:note }); if (error) setMsg(error.message); else { setMsg(t("সিদ্ধান্ত রাখা হয়েছে; কোনো টাকা পাঠানো হয়নি।", "Decision saved; no money was sent.")); void qc.invalidateQueries({queryKey:["admin-appts"]}); } }}>{approve ? t("ফেরত অনুমোদন করুন", "Approve refund") : t("প্রত্যাখ্যান করুন", "Decline")}</Button>)}</div>}</div> },
  ];
  return (
    <div>
      <h1 className="text-lg font-semibold">{t("অ্যাপয়েন্টমেন্ট", "Appointments")} <span className="font-normal text-muted-foreground">({data.length})</span></h1>
      <p className="mt-2 text-muted-foreground">{t("অনলাইন পেমেন্ট চালু নেই। এখানে শুধু ফেরতের সিদ্ধান্ত রাখা হয়; টাকা পাঠানো হয় না।", "Payments are not connected. Decisions are recorded here; no refunds are sent.")}</p>
      {msg && <p role="status" className="mt-3">{msg}</p>}
      <div className="mt-3">{isLoading ? <p className="text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p> : <SortableTable rows={data} cols={cols} rowKey={(a) => a.id} empty={t("এখনো কোনো অ্যাপয়েন্টমেন্ট নেই।", "No appointments yet.")} />}</div>
    </div>
  );
}
