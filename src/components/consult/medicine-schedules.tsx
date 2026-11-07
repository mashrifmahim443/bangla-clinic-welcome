import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { dhakaNowParts, formatDhaka, formatNumber } from "@/lib/locale";
import { medicineTimings } from "@/lib/medicine";
import { validDoseTimes } from "@/lib/medicine-reminders";

export function MedicineSchedules({ patientId, doctorId }: { patientId?: string; doctorId?: string | undefined }) {
  const { t, lang } = useLang();
  const qc = useQueryClient();
  const [name, setName] = useState(""); const [dose, setDose] = useState("");
  const [timing, setTiming] = useState(""); const [custom, setCustom] = useState(""); const [comment, setComment] = useState("");
  const [times, setTimes] = useState([""]); const [start, setStart] = useState(dhakaNowParts().date); const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(""); const [failure, setFailure] = useState("");
  const key = ["medicine-schedules", patientId ?? "me"];
  const { data, error } = useQuery({ queryKey: key, queryFn: async () => {
    const { data: auth } = await supabase.auth.getUser(); const id = patientId ?? auth.user?.id;
    if (!id) throw new Error(t("আগে লগইন করুন।", "Please sign in."));
    const { data: rows, error } = await supabase.from("medicine_schedules").select("*, doctors(name_bn,name_en)").eq("patient_id", id).order("created_at", { ascending: false });
    if (error) throw error;
    const { data: pref } = doctorId ? { data: null } : await supabase.from("medicine_reminder_preferences").select("sms_enabled").eq("patient_id", id).maybeSingle();
    const { data: profile } = await supabase.from("profiles").select("phone").eq("id", id).maybeSingle();
    return { id, rows, enabled: pref?.sms_enabled ?? false, phone: profile?.phone };
  }});
  const act = async (action: () => Promise<void>) => { setBusy(true); setNotice(""); setFailure(""); try { await action(); await qc.invalidateQueries({ queryKey: key }); setNotice(t("সংরক্ষণ হয়েছে।", "Saved.")); } catch (e) { setFailure(e instanceof Error ? e.message : String((e as { message?: string }).message ?? e)); } finally { setBusy(false); } };
  const input = "mt-1 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2";
  return <section className="mt-7 border-t border-border pt-5" aria-label={t("ওষুধের সময়সূচি", "Medicine schedule")}>
    <h2 className="font-display text-xl font-semibold">{t("ওষুধের সময়সূচি", "Medicine schedule")}</h2>
    {(failure || error) && <p role="alert" className="mt-3 break-words text-destructive">{failure || error?.message}</p>}
    {notice && <p role="status" className="mt-2 text-glucose-ok">{notice}</p>}
    {!doctorId && data && <div className="my-4 border-b border-border pb-4"><p className="text-sm">{t("SMS নম্বর", "SMS number")}: {data.phone || t("প্রোফাইলে ফোন নম্বর দিন", "Add your phone number to your profile")}</p><label className="mt-2 flex items-start gap-3"><input type="checkbox" className="mt-2 size-5 shrink-0 accent-primary" checked={data.enabled} disabled={busy} onChange={e => { const enabled = e.target.checked; void act(async () => { if (enabled && !/^(01\d{9}|8801\d{9})$/.test(data.phone ?? "")) throw new Error(t("প্রোফাইলে সঠিক ফোন নম্বর দিন।", "Add a valid phone number to your profile.")); const { error } = await supabase.from("medicine_reminder_preferences").upsert({ patient_id: data.id, sms_enabled: enabled }); if (error) throw error; }); }} /><span>{t("প্রতিবার ওষুধ খাওয়ার ১৫ মিনিট আগে SMS পেতে চাই", "Send me an SMS 15 minutes before each dose")}</span></label></div>}
    {data?.rows.length === 0 && <p className="mt-3 text-muted-foreground">{t("এখনো ওষুধের সময় লেখা হয়নি।", "No medicine schedule yet.")}</p>}
    <ul className="mt-3 divide-y divide-border">{data?.rows.map(row => <li key={row.id} className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold">{row.medicine_name} — {row.dose}</h3><span className={row.active ? "text-primary" : "text-muted-foreground"}>{row.active ? t("চলছে", "Active") : t("বন্ধ", "Stopped")}</span></div>
      <p>{t("প্রতিদিন", "Daily")} {formatNumber(row.dose_times.length, lang)} {t("বার", "times")} · {row.dose_times.map(time => formatDhaka(new Date(`2000-01-01T${time}+06:00`), lang, { hour: "numeric", minute: "2-digit" })).join(" · ")}</p>
      <p className="text-sm">{row.timing}{row.comment && <> · {row.comment}</>}</p>
      <p className="text-sm text-muted-foreground">{formatDhaka(new Date(`${row.starts_on}T00:00:00+06:00`), lang, { dateStyle: "medium" })} — {formatDhaka(new Date(`${row.ends_on}T00:00:00+06:00`), lang, { dateStyle: "medium" })}</p>
      <p className="text-sm text-muted-foreground">{row.doctors ? t(row.doctors.name_bn, row.doctors.name_en) : ""}</p>
      {doctorId === row.doctor_id && <Button variant="outline" className="mt-2 shadow-none" disabled={busy} onClick={() => void act(async () => { const { error } = await supabase.from("medicine_schedules").update({ active: !row.active }).eq("id", row.id); if (error) throw error; })}>{row.active ? t("ওষুধের সময়সূচি বন্ধ করুন", "Stop schedule") : t("আবার চালু করুন", "Resume schedule")}</Button>}
    </li>)}</ul>
    {doctorId && data && <form className="mt-5 grid min-w-0 gap-3 border-t border-border pt-5 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); void act(async () => {
      if (!validDoseTimes(times)) throw new Error(t("প্রতিবারের আলাদা সঠিক সময় দিন।", "Enter a different valid time for each dose."));
      const selected = medicineTimings.find(x => x.value === timing); const instruction = timing === "custom" ? custom.trim() : selected?.bn ?? "";
      if (!instruction) throw new Error(t("ওষুধ কখন খাবেন তা লিখুন।", "Specify when to take the medicine."));
      const { error } = await supabase.from("medicine_schedules").insert({ patient_id: data.id, doctor_id: doctorId, medicine_name: name.trim(), dose: dose.trim(), timing: instruction, comment: comment.trim(), dose_times: times, starts_on: start, ends_on: end });
      if (error) throw error; setName(""); setDose(""); setComment(""); setTimes([""]);
    }); }}>
      <h3 className="sm:col-span-2 font-semibold">{t("আলাদা ওষুধের সময় লিখুন", "Add a medicine schedule")}</h3>
      <label>{t("ওষুধের নাম", "Medicine name")}<input className={input} required maxLength={120} value={name} onChange={e => setName(e.target.value)} /></label>
      <label>{t("প্রতিবারের মাত্রা", "Dose each time")}<input className={input} required maxLength={120} value={dose} onChange={e => setDose(e.target.value)} /></label>
      <label>{t("প্রতিদিন কতবার", "Times per day")}<select className={input} value={times.length} onChange={e => setTimes(Array.from({ length: Number(e.target.value) }, (_, i) => times[i] ?? ""))}>{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{formatNumber(n, lang)}</option>)}</select></label>
      <label>{t("খাবারের আগে না পরে", "Meal timing")}<select className={input} required value={timing} onChange={e => setTiming(e.target.value)}><option value="">{t("সময় বাছুন", "Select timing")}</option>{medicineTimings.map(x => <option key={x.value} value={x.value}>{t(x.bn,x.en)}</option>)}<option value="custom">{t("নিজের মতো লিখুন", "Custom")}</option></select></label>
      {timing === "custom" && <label className="sm:col-span-2">{t("খাওয়ার নির্দেশ", "Timing instructions")}<input className={input} required maxLength={300} value={custom} onChange={e => setCustom(e.target.value)} /></label>}
      {times.map((time,i) => <label key={i}>{t("খাওয়ার সময়", "Dose time")} {formatNumber(i+1,lang)} {t("(ঢাকার সময়)", "(Dhaka time)")}<input type="time" required className={input} value={time} onChange={e => setTimes(times.map((x,j) => i===j ? e.target.value : x))} /></label>)}
      <label>{t("শুরুর তারিখ", "Start date")}<input type="date" required className={input} value={start} onChange={e => setStart(e.target.value)} /></label>
      <label>{t("শেষের তারিখ", "End date")}<input type="date" required min={start} className={input} value={end} onChange={e => setEnd(e.target.value)} /></label>
      <label className="sm:col-span-2">{t("মন্তব্য (চাইলে)", "Comment (optional)")}<textarea className={input} maxLength={500} value={comment} onChange={e => setComment(e.target.value)} /></label>
      <Button disabled={busy} className="h-auto whitespace-normal shadow-none sm:col-span-2">{busy ? t("সংরক্ষণ হচ্ছে…", "Saving…") : t("ওষুধের সময় সংরক্ষণ করুন", "Save medicine schedule")}</Button>
    </form>}
  </section>;
}