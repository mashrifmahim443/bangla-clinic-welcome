import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { dhakaNowParts, formatDhaka } from "@/lib/locale";
import { appointmentLabels, consultationLabels, fieldClass, flatButton, canTransition, useAppointmentRealtime } from "@/lib/appointments";
export function AppointmentList({ as }: { as: "patient" | "doctor" }) {
  const { lang, t } = useLang(); const qc = useQueryClient(); useAppointmentRealtime();
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [edit, setEdit] = useState(""); const [date, setDate] = useState(dhakaNowParts().date); const [slot, setSlot] = useState(""); const [rating, setRating] = useState(5); const [body, setBody] = useState("");
  const { data = [], isLoading, error } = useQuery({ queryKey: ["appointments", as], queryFn: async () => {
    const { data: u } = await supabase.auth.getUser(); if (!u.user) return [];
    let q = supabase.from("appointments").select("*,doctors(name_bn,name_en,user_id)").order("slot_start", { ascending: false });
    if (as === "patient") q = q.eq("patient_id", u.user.id); else { const { data: doctor } = await supabase.from("doctors").select("id").eq("user_id", u.user.id).maybeSingle(); if (!doctor) return []; q = q.eq("doctor_id", doctor.id); }
    const { data, error } = await q; if (error) throw error;
    const ids = [...new Set(data.map(a => a.patient_id))]; const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", ids);
    return data.map(a => ({ ...a, patientName: profiles?.find(p => p.id === a.patient_id)?.full_name }));
  } });
  const selected = data.find(a => a.id === edit);
  const { data: slots = [] } = useQuery({ queryKey: ["available-slots", selected?.doctor_id, date], enabled: !!selected && as === "doctor", queryFn: async () => { if (!selected) return []; const { data, error } = await supabase.rpc("available_doctor_slots", { _doctor: selected.doctor_id, _from: date, _to: date }); if (error) throw error; return data; } });
  const { data: reviews = [] } = useQuery({ queryKey: ["my-appointment-reviews"], enabled: as === "patient", queryFn: async () => { const { data, error } = await supabase.rpc("my_reviewed_appointments"); if (error) throw error; return data; } });
  async function change(id: string, status: string, nextSlot?: string) {
    let reason = ""; if (status === "cancelled") { const answer = prompt(t("বাতিলের কারণ লিখুন", "Enter cancellation reason")); if (answer === null) return; reason = answer; }
    setBusy(true); setMsg(""); const { error } = await supabase.rpc("change_appointment", { _id: id, _status: status, _reason: reason, ...(nextSlot ? { _slot: nextSlot } : {}) }); setBusy(false);
    if (error) setMsg(error.message); else { setEdit(""); setMsg(t("অ্যাপয়েন্টমেন্ট বদলানো হয়েছে।", "Appointment updated.")); void qc.invalidateQueries({ queryKey: ["appointments"] }); }
  }
  return <section className="mt-10"><h2 className="font-display text-xl font-semibold">{t("অ্যাপয়েন্টমেন্ট", "Appointments")}</h2>
    {msg && <p role="status" className="mt-3 border-l-2 border-primary pl-3">{msg}</p>}{error && <p role="alert" className="text-destructive">{error.message}</p>}
    {isLoading ? <p>{t("লোড হচ্ছে…", "Loading…")}</p> : !data.length ? <p className="mt-3 text-muted-foreground">{t("এখনো কোনো অ্যাপয়েন্টমেন্ট নেই।", "No appointments yet.")}</p> : <ul className="mt-3 divide-y divide-border border-t border-border">{data.map(a => <li key={a.id} className="py-5">
      <div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold">{as === "patient" ? t(a.doctors?.name_bn ?? "", a.doctors?.name_en ?? "") : a.patientName || t("রোগী", "Patient")}</p><p>{formatDhaka(new Date(a.slot_start), lang)}</p><p className="text-sm text-muted-foreground">{t(...(consultationLabels[a.consultation_type] ?? [a.consultation_type,a.consultation_type]))} · {t(...(appointmentLabels[a.status] ?? [a.status,a.status]))}</p><p className="mt-1 whitespace-pre-wrap text-sm">{a.reason}</p>{a.refund_decision && <p className="text-sm text-accent">{t(...(appointmentLabels[a.refund_decision] ?? [a.refund_decision,a.refund_decision]))} · {t("পেমেন্ট হয়নি; টাকা ফেরত দেওয়া হয়নি।", "No payment collected; no refund sent.")}{a.refund_note ? ` · ${a.refund_note}` : ""}</p>}</div></div>
      <div className="mt-3 flex flex-wrap gap-2">
        {as === "doctor" && canTransition(a.status,"confirmed",as,false) && <Button disabled={busy} className={flatButton} onClick={() => change(a.id,"confirmed")}>{t("গ্রহণ করুন", "Accept")}</Button>}
        {canTransition(a.status,"cancelled",as,false) && <Button disabled={busy} variant="outline" className={flatButton} onClick={() => change(a.id,"cancelled")}>{t("বাতিল করুন", "Cancel")}</Button>}
        {as === "doctor" && ["pending","confirmed"].includes(a.status) && <Button variant="outline" className={flatButton} onClick={() => { setEdit(edit === a.id ? "" : a.id); setSlot(""); }}>{t("সময় বদলান", "Reschedule")}</Button>}
        {as === "doctor" && (["completed","no_show"] as const).map(s => canTransition(a.status,s,as,new Date(a.slot_start).getTime() <= Date.now()) && <Button key={s} disabled={busy} variant="outline" className={flatButton} onClick={() => change(a.id,s)}>{t(...(appointmentLabels[s] ?? [s,s]))}</Button>)}
        {["confirmed","completed"].includes(a.status) && <Button asChild variant="outline" className={flatButton}><Link to="/consult/$id" params={{ id: a.id }}>{t("পরামর্শ কক্ষে যান", "Enter room")}</Link></Button>}
        {as === "doctor" && <Button asChild variant="outline" className={flatButton}><Link to="/patient-history/$id" params={{ id: a.id }}>{t("রোগীর ইতিহাস", "Patient history")}</Link></Button>}
        <Button asChild variant="link" className={flatButton}><Link to={as === "doctor" ? "/rx-write/$id" : "/prescription/$id"} params={{ id: a.id }}>{as === "doctor" ? t("প্রেসক্রিপশন লিখুন", "Write prescription") : t("প্রেসক্রিপশন", "Prescription")}</Link></Button>
        {as === "patient" && a.status === "completed" && !reviews.includes(a.id) && <Button variant="outline" className={flatButton} onClick={() => { setEdit(edit === a.id ? "" : a.id); setBody(""); }}>{t("রিভিউ দিন", "Leave review")}</Button>}
      </div>
      {edit === a.id && as === "doctor" && <div className="mt-4 grid max-w-xl gap-3 sm:grid-cols-2"><label>{t("নতুন তারিখ", "New date")}<input type="date" min={dhakaNowParts().date} value={date} className={fieldClass} onChange={e => { setDate(e.target.value); setSlot(""); }} /></label><label>{t("খালি সময়", "Available slot")}<select className={fieldClass} value={slot} onChange={e => setSlot(e.target.value)}><option value="">{t("বেছে নিন", "Choose")}</option>{slots.map(s => <option key={s.slot_start} value={s.slot_start}>{formatDhaka(new Date(s.slot_start),lang,{timeStyle:"short"})}</option>)}</select></label><Button disabled={!slot || busy} className={flatButton} onClick={() => change(a.id,"confirmed",slot)}>{t("নতুন সময় নিশ্চিত করুন", "Confirm new time")}</Button></div>}
      {edit === a.id && as === "patient" && <form className="mt-4 max-w-xl" onSubmit={async e => { e.preventDefault(); setBusy(true); const { error } = await supabase.from("doctor_reviews").insert({ appointment_id: a.id, doctor_id: a.doctor_id, rating, body }); setBusy(false); if (error) setMsg(error.message); else { setEdit(""); setMsg(t("রিভিউ পাঠানো হয়েছে।", "Review submitted.")); void qc.invalidateQueries({ queryKey: ["doctor-reviews"] }); void qc.invalidateQueries({ queryKey: ["my-appointment-reviews"] }); } }}><label>{t("রেটিং", "Rating")}<select className={fieldClass} value={rating} onChange={e => setRating(Number(e.target.value))}>{[5,4,3,2,1].map(n => <option value={n} key={n}>{n}/5</option>)}</select></label><label className="mt-3 block">{t("আপনার অভিজ্ঞতা", "Your experience")}<textarea rows={3} maxLength={1000} className={fieldClass} value={body} onChange={e => setBody(e.target.value)} /></label><Button disabled={busy} className={`mt-3 ${flatButton}`}>{t("রিভিউ পাঠান", "Submit review")}</Button></form>}
    </li>)}</ul>}
  </section>;
}
