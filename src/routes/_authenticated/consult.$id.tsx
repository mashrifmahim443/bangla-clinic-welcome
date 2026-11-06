import { OldPrescriptions } from "@/components/consult/old-prescriptions";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka, formatNumber } from "@/lib/locale";
import { UNIT, formatGlucose, glucoseState } from "@/lib/glucose";
import { ageFromBirthYear, diabetesTypes, type DiabetesType } from "@/lib/profile";
import { useAppointment, usePrescription, type RxItem } from "@/lib/consult";

export const Route = createFileRoute("/_authenticated/consult/$id")({
  head: () => ({ meta: [{ title: "Consultation room — DiabeCare" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const stateClass = { low: "text-glucose-low", ok: "text-glucose-ok", high: "text-glucose-high" };

function Page() {
  const { id } = Route.useParams();
  const { lang, setLang, t } = useLang();
  const { data: appt, isLoading } = useAppointment(id);

  if (isLoading) return <p className="p-10 text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p>;
  if (!appt) return <p className="p-10">{t("এই অ্যাপয়েন্টমেন্টটা খুঁজে পাওয়া গেল না।", "We couldn't find this appointment.")}</p>;
  const d = appt.doctors;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div>
          <Link to={appt.isDoctor ? "/doctor" : "/patient"} className="text-sm text-primary underline underline-offset-4">{t("← ফিরে যান", "← Back")}</Link>
          <h1 className="font-display text-xl font-semibold">
            {appt.isDoctor ? (appt.patient?.full_name ?? t("রোগী", "Patient")) : t(d?.name_bn ?? "", d?.name_en ?? "")}
          </h1>
          <p className="text-sm text-muted-foreground">{formatDhaka(new Date(appt.slot_start), lang, { dateStyle: "full", timeStyle: "short" })}</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <a href={`https://meet.jit.si/DiabeCare-${id}`} target="_blank" rel="noreferrer"
            className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">
            {t("ভিডিও কলে যান", "Join video call")}
          </a>
          <Link to="/prescription/$id" params={{ id }} className="text-primary underline underline-offset-4">{t("প্রেসক্রিপশন দেখুন", "View prescription")}</Link>
          <button onClick={() => setLang(lang === "bn" ? "en" : "bn")} className="text-primary underline underline-offset-4">{lang === "bn" ? "English" : "বাংলা"}</button>
        </div>
      </header>
      <div className="grid min-h-0 flex-1 md:grid-cols-[1fr_24rem]">
        <div className="flex min-h-0 flex-col">
          <p className="border-b border-border bg-secondary px-6 py-2 text-sm text-muted-foreground">
            {t("ভিডিও কল নতুন ট্যাবে খুলবে। ডাক্তার আর রোগী দুজনেই একই বোতাম চাপলে একই কলে যুক্ত হবেন। ক্যামেরা আর মাইকের অনুমতি দিন।", "The video call opens in a new tab. Doctor and patient join the same call with the same button. Allow camera and microphone.")}
          </p>
          <Chat appointmentId={id} me={appt.me} />
        </div>
        <aside className="overflow-y-auto border-t border-border bg-card p-6 md:border-t-0 md:border-l">
          <Summary patientId={appt.patient_id} appointmentId={id} phone={appt.patient?.phone ?? null} dtype={appt.patient?.diabetes_type ?? null} birthYear={appt.patient?.birth_year ?? null} />
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t("রোগীর পুরনো প্রেসক্রিপশন", "Patient's old prescriptions")}</h3>
            <OldPrescriptions patientId={appt.patient_id} />
          </div>
          {appt.isDoctor && <CompleteButton id={id} status={appt.status} />}
          {appt.isDoctor && d && <RxForm appointmentId={id} patientId={appt.patient_id} doctorId={d.id} />}
        </aside>
      </div>
    </div>
  );
}

function Chat({ appointmentId, me }: { appointmentId: string; me: string }) {
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const key = ["messages", appointmentId];
  const { data: msgs = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("consult_messages").select("id, sender_id, body, created_at").eq("appointment_id", appointmentId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    const ch = supabase.channel(`consult-${appointmentId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "consult_messages", filter: `appointment_id=eq.${appointmentId}` }, () => qc.invalidateQueries({ queryKey: key }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);
  useEffect(() => { endRef.current?.scrollIntoView(); }, [msgs.length]);

  const send = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from("consult_messages").insert({ appointment_id: appointmentId, body });
      if (error) throw error;
    },
    onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: key }); },
  });

  return (
    <section className="flex min-h-0 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-6">
        {msgs.length === 0 && <p className="text-muted-foreground">{t("এখনো কোনো কথা হয়নি। প্রথম বার্তাটা লিখুন।", "No messages yet. Write the first one.")}</p>}
        {msgs.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={`max-w-[75%] rounded-md border border-border px-4 py-2 ${mine ? "ml-auto bg-secondary" : "bg-card"}`}>
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatDhaka(new Date(m.created_at), lang, { timeStyle: "short" })}</p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); const b = text.trim(); if (b) send.mutate(b); }} className="flex gap-2 border-t border-border bg-card p-4">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder={t("বার্তা লিখুন…", "Write a message…")}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2" />
        <button disabled={send.isPending} className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:opacity-60">{t("পাঠান", "Send")}</button>
      </form>
      {send.isError && <p className="px-4 pb-3 text-sm text-destructive">{t("বার্তাটা যায়নি, আবার চেষ্টা করুন।", "The message didn't send. Try again.")}</p>}
    </section>
  );
}

function CompleteButton({ id, status }: { id: string; status: string }) {
  const { t } = useLang();
  const qc = useQueryClient();
  if (status === "completed") return <p className="mt-4 text-sm text-glucose-ok">{t("এই পরামর্শ শেষ হয়েছে।", "This consultation is complete.")}</p>;
  return (
    <button onClick={async () => {
      const { error } = await supabase.from("appointments").update({ status: "completed" }).eq("id", id);
      if (error) return alert(t("সম্পন্ন করা যায়নি।", "Couldn't mark as complete."));
      qc.invalidateQueries({ queryKey: ["appointment", id] });
    }} className="mt-4 w-full rounded-md border border-primary px-4 py-2 text-primary transition-colors duration-150 hover:bg-secondary">
      {t("পরামর্শ শেষ হয়েছে", "Mark consultation complete")}
    </button>
  );
}

function Summary({ patientId, appointmentId, phone, dtype, birthYear }: { patientId: string; appointmentId: string; phone: string | null; dtype: DiabetesType | null; birthYear: number | null }) {
  const age = ageFromBirthYear(birthYear);
  const { lang, t } = useLang();
  const { data: readings = [] } = useQuery({
    queryKey: ["patient-readings", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("glucose_readings").select("id, value_mmol, reading_type, taken_at, note").eq("user_id", patientId).order("taken_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data.map((r) => ({ ...r, value_mmol: r.value_mmol ?? 0 }));
    },
  });
  const { data: rx } = usePrescription(appointmentId);
  return (
    <div>
      <h2 className="font-display text-lg font-semibold">{t("রোগীর সারাংশ", "Patient summary")}</h2>
      <p className="text-sm text-muted-foreground">
        {dtype ? t(...diabetesTypes[dtype]) : t("ধরন জানানো হয়নি", "Type not given")}
        {age ? <> · {formatNumber(age, lang)} {t("বছর", "yrs")}</> : null}
        {phone && <> · {phone}</>}
      </p>
      <h3 className="mt-5 text-sm font-medium text-muted-foreground">{t(`সাম্প্রতিক সুগার (${UNIT})`, `Recent sugar (${UNIT})`)}</h3>
      {readings.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">{t("এখনো কোনো রিডিং লেখা হয়নি।", "No readings logged yet.")}</p> : (
        <table className="mt-2 w-full text-sm">
          <tbody>
            {readings.map((r) => (
              <tr key={r.id} className="border-b border-border">
                <td className="py-1.5">{formatDhaka(new Date(r.taken_at), lang, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</td>
                <td className="py-1.5 pl-2 text-xs text-muted-foreground">{r.note}</td>
                <td className={`py-1.5 text-right font-medium ${stateClass[glucoseState(r.value_mmol)]}`}>{formatGlucose(r.value_mmol, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h3 className="mt-6 text-sm font-medium text-muted-foreground">{t("ওষুধ", "Medicines")}</h3>
      {!rx || rx.items.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">{t("এখনো কোনো ওষুধ লেখা হয়নি।", "No medicines written yet.")}</p> : (
        <ul className="mt-2 divide-y divide-border text-sm">
          {rx.items.map((m, i) => <li key={i} className="py-1.5"><span className="font-medium">{m.name}</span> — {m.dose} · {m.timing}</li>)}
        </ul>
      )}
    </div>
  );
}

const blank: RxItem = { name: "", dose: "", timing: "", duration: "" };

function RxForm({ appointmentId, patientId, doctorId }: { appointmentId: string; patientId: string; doctorId: string }) {
  const { t } = useLang();
  const qc = useQueryClient();
  const { data: rx, isLoading } = usePrescription(appointmentId);
  const [items, setItems] = useState<RxItem[] | null>(null);
  const [cc, setCc] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [follow, setFollow] = useState<string | null>(null);
  if (isLoading) return null;
  const its = items ?? (rx?.items.length ? rx.items : [blank]);
  const save = async () => {
    const payload = {
      appointment_id: appointmentId, patient_id: patientId, doctor_id: doctorId,
      chief_complaints: cc ?? rx?.chief_complaints ?? null,
      items: its.filter((i) => i.name.trim()),
      advice: advice ?? rx?.advice ?? null,
      follow_up_date: (follow ?? rx?.follow_up_date) || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("prescriptions").upsert(payload, { onConflict: "appointment_id" });
    if (error) { alert(t("সংরক্ষণ হয়নি, আবার চেষ্টা করুন।", "Couldn't save. Try again.")); return; }
    qc.invalidateQueries({ queryKey: ["prescription", appointmentId] });
  };
  const inp = "w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm";
  const upd = (i: number, k: keyof RxItem, v: string) => setItems(its.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  return (
    <div className="mt-8 border-t border-border pt-6">
      <h2 className="font-display text-lg font-semibold">{t("প্রেসক্রিপশন লিখুন", "Write prescription")}</h2>
      <label className="mt-3 block text-sm">{t("সমস্যা", "Complaints")}
        <textarea rows={2} className={inp} value={cc ?? rx?.chief_complaints ?? ""} onChange={(e) => setCc(e.target.value)} /></label>
      <div className="mt-3 space-y-3">
        {its.map((m, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 border-b border-border pb-3">
            <input className={`${inp} col-span-2`} placeholder={t("ওষুধের নাম (যেমন Tab. Metformin 500mg)", "Medicine (e.g. Tab. Metformin 500mg)")} value={m.name} onChange={(e) => upd(i, "name", e.target.value)} />
            <input className={inp} placeholder="১+০+১" value={m.dose} onChange={(e) => upd(i, "dose", e.target.value)} />
            <input className={inp} placeholder={t("খাওয়ার পরে", "After meal")} value={m.timing} onChange={(e) => upd(i, "timing", e.target.value)} />
            <input className={`${inp} col-span-2`} placeholder={t("কতদিন (যেমন ১ মাস)", "Duration (e.g. 1 month)")} value={m.duration} onChange={(e) => upd(i, "duration", e.target.value)} />
          </div>
        ))}
      </div>
      <button onClick={() => setItems([...its, blank])} className="mt-2 text-sm text-primary underline underline-offset-4">{t("+ আরেকটা ওষুধ যোগ করুন", "+ Add another medicine")}</button>
      <label className="mt-3 block text-sm">{t("পরামর্শ", "Advice")}
        <textarea rows={3} className={inp} value={advice ?? rx?.advice ?? ""} onChange={(e) => setAdvice(e.target.value)} /></label>
      <label className="mt-3 block text-sm">{t("আবার দেখাবেন", "Follow-up date")}
        <input type="date" className={inp} value={follow ?? rx?.follow_up_date ?? ""} onChange={(e) => setFollow(e.target.value)} /></label>
      <button onClick={save} className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors duration-150 hover:bg-primary/90">{t("প্রেসক্রিপশন সংরক্ষণ করুন", "Save prescription")}</button>
    </div>
  );
}
