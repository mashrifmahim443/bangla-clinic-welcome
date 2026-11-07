import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka, formatNumber } from "@/lib/locale";
import { usePrescription, type RxItem } from "@/lib/consult";
import { medicineTimings, medicineTimingSelection, medicineTimingText, selectMedicineTiming } from "@/lib/medicine";

const blank = (): RxItem => ({ name: "", dose: "", timing: "", duration: "", comment: "" });
const doses = ["1+0+1", "1+0+0", "0+0+1", "1+1+1", "0+1+0"];
const durations: [string, string][] = [["৭ দিন", "7 days"], ["১৫ দিন", "15 days"], ["১ মাস", "1 month"], ["৩ মাস", "3 months"], ["চলবে", "Continue"]];

type Props = { appointmentId: string; patientId: string; doctorId: string; doctor: { name_bn: string; name_en: string; degrees: string | null; bmdc_no: string | null } | null; patientName: string };

export function RxEditor({ appointmentId, patientId, doctorId, doctor, patientName }: Props) {
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const { data: rx, isLoading } = usePrescription(appointmentId);
  const [items, setItems] = useState<RxItem[]>([blank()]);
  const [cc, setCc] = useState(""); const [advice, setAdvice] = useState(""); const [follow, setFollow] = useState("");
  const [loaded, setLoaded] = useState(false); const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false); const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (isLoading || loaded) return;
    setItems(rx?.items.length ? rx.items.map(i => ({ ...blank(), ...i })) : [blank()]);
    setCc(rx?.chief_complaints ?? ""); setAdvice(rx?.advice ?? ""); setFollow(rx?.follow_up_date ?? ""); setLoaded(true);
  }, [isLoading, loaded, rx]);

  const touch = () => { setDirty(true); setMsg(null); };
  const upd = (i: number, patch: Partial<RxItem>) => { touch(); setItems(items.map((x, j) => (j === i ? { ...x, ...patch } : x))); };
  const move = (i: number, d: -1 | 1) => { const n = [...items]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j]!, n[i]!]; touch(); setItems(n); };
  const remove = (i: number) => { touch(); setItems(items.length === 1 ? [blank()] : items.filter((_, j) => j !== i)); };

  const save = async () => {
    const filled = items.filter(i => i.name.trim());
    if (!filled.length && !advice.trim()) { setMsg({ ok: false, text: t("অন্তত একটা ওষুধ বা পরামর্শ লিখুন।", "Write at least one medicine or some advice.") }); return; }
    const noDose = filled.find(i => !i.dose.trim());
    if (noDose) { setMsg({ ok: false, text: t(`"${noDose.name}"-এর মাত্রা লিখুন।`, `Add a dose for "${noDose.name}".`) }); return; }
    setSaving(true); setMsg(null);
    const { error } = await supabase.from("prescriptions").upsert({
      appointment_id: appointmentId, patient_id: patientId, doctor_id: doctorId,
      chief_complaints: cc.trim() || null, items: filled.map(i => ({ ...i, name: i.name.trim(), dose: i.dose.trim() })),
      advice: advice.trim() || null, follow_up_date: follow || null, updated_at: new Date().toISOString(),
    }, { onConflict: "appointment_id" });
    setSaving(false);
    if (error) { setMsg({ ok: false, text: t("সংরক্ষণ হয়নি: ", "Couldn't save: ") + error.message }); return; }
    setDirty(false);
    void qc.invalidateQueries({ queryKey: ["prescription", appointmentId] });
    void qc.invalidateQueries({ queryKey: ["my-advice"] });
    setMsg({ ok: true, text: t("প্রেসক্রিপশন সংরক্ষণ হয়েছে। রোগী এখন দেখতে পাবেন।", "Prescription saved. The patient can see it now.") });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); void save(); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  });

  if (!loaded) return <p className="text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p>;
  const inp = "mt-1 w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-base";
  const chip = "rounded-md border border-border bg-card px-2 py-1 text-sm transition-colors duration-150 hover:border-primary hover:text-primary";
  const filled = items.filter(i => i.name.trim());

  return <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_26rem]">
    <div className="min-w-0">
      <label className="block font-medium">{t("রোগীর সমস্যা / রোগ নির্ণয়", "Complaints / diagnosis")}
        <textarea rows={2} className={inp} value={cc} onChange={e => { setCc(e.target.value); touch(); }} placeholder={t("যেমন: টাইপ ২ ডায়াবেটিস, খালি পেটে সুগার বেশি", "e.g. Type 2 diabetes, high fasting sugar")} /></label>

      <div className="mt-6 flex items-baseline justify-between border-b-2 border-primary pb-2">
        <h2 className="font-display text-2xl font-semibold text-primary">℞ {t("ওষুধ", "Medicines")}</h2>
        <span className="text-sm text-muted-foreground">{formatNumber(filled.length, lang)} {t("টি", "added")}</span>
      </div>
      <ol className="divide-y divide-border">
        {items.map((m, i) => <li key={i} className="py-4">
          <div className="flex items-start gap-3">
            <span className="mt-8 w-6 shrink-0 font-display text-lg text-muted-foreground">{formatNumber(i + 1, lang)}.</span>
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
              <label className="min-w-0 text-sm sm:col-span-2">{t("ওষুধের নাম ও শক্তি", "Medicine name & strength")}
                <input className={inp} autoFocus={i === items.length - 1 && i > 0} placeholder={t("যেমন Tab. Metformin 500mg", "e.g. Tab. Metformin 500mg")} value={m.name} onChange={e => upd(i, { name: e.target.value })} /></label>
              <div className="min-w-0 text-sm"><label>{t("মাত্রা (সকাল+দুপুর+রাত)", "Dose (morning+noon+night)")}<input className={inp} placeholder="1+0+1" value={m.dose} onChange={e => upd(i, { dose: e.target.value })} /></label>
                <div className="mt-1.5 flex flex-wrap gap-1">{doses.map(d => <button type="button" key={d} className={chip} onClick={() => upd(i, { dose: d })}>{d}</button>)}</div></div>
              <div className="min-w-0 text-sm"><label>{t("কখন খাবেন", "When to take")}
                <select className={inp} value={medicineTimingSelection(m)} onChange={e => { touch(); setItems(items.map((x, j) => j === i ? selectMedicineTiming(x, e.target.value) : x)); }}>
                  <option value="">{t("সময় বাছুন", "Select timing")}</option>
                  {medicineTimings.map(o => <option key={o.value} value={o.value}>{t(o.bn, o.en)}</option>)}
                  <option value="custom">{t("নিজের মতো লিখুন", "Custom")}</option>
                </select></label>
                {medicineTimingSelection(m) === "custom" && <input className={inp} value={m.timing} onChange={e => upd(i, { timing: e.target.value })} placeholder={t("যেমন খাবারের ২০ মিনিট আগে", "e.g. 20 minutes before a meal")} />}</div>
              <div className="min-w-0 text-sm sm:col-span-2"><label>{t("কতদিন খাবেন", "Duration")}<input className={inp} placeholder={t("যেমন ১ মাস", "e.g. 1 month")} value={m.duration} onChange={e => upd(i, { duration: e.target.value })} /></label>
                <div className="mt-1.5 flex flex-wrap gap-1">{durations.map(d => <button type="button" key={d[1]} className={chip} onClick={() => upd(i, { duration: t(...d) })}>{t(...d)}</button>)}</div></div>
              <label className="min-w-0 text-sm sm:col-span-2">{t("এই ওষুধের মন্তব্য (চাইলে)", "Note for this medicine (optional)")}
                <input className={inp} value={m.comment ?? ""} onChange={e => upd(i, { comment: e.target.value })} /></label>
            </div>
            <div className="mt-7 flex shrink-0 flex-col gap-1">
              <Button type="button" size="icon" variant="ghost" aria-label={t("উপরে নিন", "Move up")} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp strokeWidth={1.5} /></Button>
              <Button type="button" size="icon" variant="ghost" aria-label={t("নিচে নিন", "Move down")} disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown strokeWidth={1.5} /></Button>
              <Button type="button" size="icon" variant="ghost" aria-label={t("মুছুন", "Remove")} className="text-destructive" onClick={() => remove(i)}><Trash2 strokeWidth={1.5} /></Button>
            </div>
          </div>
        </li>)}
      </ol>
      <Button type="button" variant="outline" className="w-full shadow-none" onClick={() => { touch(); setItems([...items, blank()]); }}>{t("+ আরেকটা ওষুধ যোগ করুন", "+ Add another medicine")}</Button>

      <label className="mt-6 block font-medium">{t("পরামর্শ", "Advice")}
        <textarea rows={4} className={inp} value={advice} onChange={e => { setAdvice(e.target.value); touch(); }} placeholder={t("যেমন: প্রতিদিন ৩০ মিনিট হাঁটুন, মিষ্টি এড়িয়ে চলুন", "e.g. Walk 30 minutes daily, avoid sweets")} /></label>
      <label className="mt-4 block max-w-xs font-medium">{t("আবার কবে দেখাবেন", "Follow-up date")}
        <input type="date" className={inp} value={follow} onChange={e => { setFollow(e.target.value); touch(); }} /></label>

      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-3 border-t border-border bg-background py-4">
        <Button onClick={save} disabled={saving} className="shadow-none">{saving ? t("সংরক্ষণ হচ্ছে…", "Saving…") : t("প্রেসক্রিপশন সংরক্ষণ করুন", "Save prescription")}</Button>
        <Button asChild variant="outline" className="shadow-none"><Link to="/prescription/$id" params={{ id: appointmentId }}>{t("প্রিন্টের রূপ দেখুন", "Open print view")}</Link></Button>
        {msg ? <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-sm text-glucose-ok" : "text-sm text-destructive"}>{msg.text}</p>
          : dirty && <p className="text-sm text-muted-foreground">{t("সংরক্ষণ করা হয়নি এমন পরিবর্তন আছে (Ctrl+S)", "Unsaved changes (Ctrl+S)")}</p>}
      </div>
    </div>

    <aside className="hidden xl:block">
      <p className="mb-2 text-sm text-muted-foreground">{t("রোগী যেভাবে দেখবেন", "What the patient will see")}</p>
      <div className="sticky top-6 border border-border bg-card p-6 font-display text-sm">
        <div className="border-b-2 border-primary pb-3">
          <p className="text-lg font-semibold text-primary">{doctor ? t(doctor.name_bn, doctor.name_en) : ""}</p>
          <p>{doctor?.degrees}</p><p className="text-xs">BMDC: {doctor?.bmdc_no}</p>
        </div>
        <p className="mt-3">{t("রোগী", "Patient")}: <span className="font-semibold">{patientName}</span> · {formatDhaka(new Date(), lang, { dateStyle: "medium" })}</p>
        {cc.trim() && <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{cc}</p>}
        <p className="mt-4 text-3xl text-primary">℞</p>
        {filled.length ? <ol className="mt-2 space-y-2">{filled.map((m, i) => <li key={i}><p className="font-semibold">{formatNumber(i + 1, lang)}. {m.name}</p><p>{[m.dose, medicineTimingText(m, t), m.duration].filter(Boolean).join(" · ")}</p>{m.comment && <p className="text-muted-foreground">{m.comment}</p>}</li>)}</ol>
          : <p className="mt-2 text-muted-foreground">{t("এখনো কোনো ওষুধ লেখা হয়নি।", "No medicines yet.")}</p>}
        {advice.trim() && <><p className="mt-4 font-semibold">{t("পরামর্শ", "Advice")}</p><p className="whitespace-pre-wrap">{advice}</p></>}
        {follow && <p className="mt-4 border-t border-border pt-2">{t("আবার দেখাবেন", "Follow-up")}: {formatDhaka(new Date(follow + "T12:00:00+06:00"), lang, { dateStyle: "long" })}</p>}
      </div>
    </aside>
  </div>;
}
