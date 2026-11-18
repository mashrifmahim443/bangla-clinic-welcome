import { pageHead } from "@/lib/appointments";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PlanTable } from "@/components/diet/plan-table";
import { RoleShell } from "@/components/site/role-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAppointment } from "@/lib/consult";
import { bmi, normalizeCells, standardCells, type PlanCells } from "@/lib/diet-plan";
import { UNIT, formatGlucose } from "@/lib/glucose";
import { useDietTemplates } from "@/lib/diet-templates";
import { useLang } from "@/lib/i18n";
import { formatNumber } from "@/lib/locale";
import { ageFromBirthYear, diabetesTypes, type DiabetesType } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/diet-plan/$id")({
  head: () => pageHead('Write a patient diet plan', 'Prepare a private weekly Diacare diet plan for your patient.'),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const { data: appt } = useAppointment(id);
  const pid = appt?.patient_id;
  const doctorId = appt?.doctors?.id;
  const { data: info } = useQuery({
    queryKey: ["diet-patient", pid],
    enabled: !!pid,
    queryFn: async () => {
      const [{ data: p }, { data: r }, { data: plan }] = await Promise.all([
        supabase.from("profiles").select("full_name, birth_year, gender, diabetes_type, diagnosed_year, medicines, weight_kg, height_cm, other_conditions").eq("id", pid!).maybeSingle(),
        supabase.from("glucose_readings").select("value_mmol, reading_type").eq("user_id", pid!).gte("taken_at", new Date(Date.now() - 30 * 864e5).toISOString()),
        supabase.from("diet_plans").select("*").eq("patient_id", pid!).eq("doctor_id", doctorId!).maybeSingle(),
      ]);
      const vals = (r ?? []).filter((x) => x.value_mmol != null);
      const avg = (f: (x: (typeof vals)[number]) => boolean) => { const v = vals.filter(f); return v.length ? v.reduce((s, x) => s + x.value_mmol!, 0) / v.length : null; };
      return { p, plan, n: vals.length, avgAll: avg(() => true), avgFasting: avg((x) => x.reading_type === "fasting"), avgAfter: avg((x) => x.reading_type === "after_meal") };
    },
  });
  const [cells, setCells] = useState<PlanCells | null>(null);
  const [calories, setCalories] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const { data: templates } = useDietTemplates();
  if (!appt || !info) return <RoleShell role="doctor"><p className="text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p></RoleShell>;
  if (!appt.isDoctor) return <RoleShell role="doctor"><p>{t("শুধু এই রোগীর ডাক্তার খাদ্য তালিকা লিখতে পারবেন।", "Only this patient's doctor can write the diet plan.")}</p></RoleShell>;
  const c = cells ?? (info.plan ? normalizeCells(info.plan.cells) : standardCells());
  const cal = calories ?? (info.plan?.calories ? String(info.plan.calories) : "");
  const nt = notes ?? info.plan?.notes ?? "";
  const p = info.p;
  const b = bmi(p?.weight_kg, p?.height_cm);
  const age = ageFromBirthYear(p?.birth_year);
  const g = (v: number | null) => (v == null ? "—" : `${formatGlucose(Math.round(v * 10) / 10, lang)} ${UNIT}`);

  async function save() {
    const kcal = cal ? Number(cal) : null;
    if (kcal !== null && (!Number.isInteger(kcal) || kcal < 800 || kcal > 4000)) return setMsg(t("ক্যালরি ৮০০ থেকে ৪০০০-এর মধ্যে লিখুন।", "Calories must be 800–4000."));
    const { error } = await supabase.from("diet_plans").upsert({ patient_id: pid!, doctor_id: doctorId!, appointment_id: id, cells: c, calories: kcal, notes: nt.trim() || null, updated_at: new Date().toISOString() }, { onConflict: "patient_id,doctor_id" });
    if (error) return setMsg(`${error.message} — ${t("সংরক্ষণ হয়নি।", "Not saved.")}`);
    setMsg(t("সংরক্ষণ হয়েছে। রোগী এখন তাঁর পাতায় দেখতে পাবেন।", "Saved. The patient can now see it."));
    qc.invalidateQueries({ queryKey: ["diet-patient"] });
  }
  const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="flex justify-between gap-3 border-b border-border py-1.5 last:border-0"><dt className="text-muted-foreground">{k}</dt><dd className="text-right font-medium">{v || "—"}</dd></div>;

  return (
    <RoleShell role="doctor">
      <Link to="/consult/$id" params={{ id }} className="text-sm text-primary underline underline-offset-4">{t("← কনসালটেশনে ফিরুন", "← Back to consultation")}</Link>
      <h1 className="mt-3 font-display text-3xl font-semibold">{t("খাদ্য তালিকা লিখুন", "Write diet plan")} · {p?.full_name ?? t("রোগী", "Patient")}</h1>
      <div className="mt-5 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside className="h-fit rounded-[10px] border border-border bg-card p-4 text-sm">
          <h2 className="mb-2 font-semibold">{t("রোগীর তথ্য", "Patient details")}</h2>
          <dl>
            <Row k={t("বয়স", "Age")} v={age ? `${formatNumber(age, lang)} ${t("বছর", "yrs")}` : ""} />
            <Row k={t("লিঙ্গ", "Gender")} v={p?.gender === "m" ? t("পুরুষ", "Male") : p?.gender === "f" ? t("নারী", "Female") : ""} />
            <Row k={t("ধরন", "Type")} v={p?.diabetes_type ? t(...diabetesTypes[p.diabetes_type as DiabetesType]) : ""} />
            <Row k={t("ডায়াবেটিস ধরা পড়েছে", "Diagnosed")} v={p?.diagnosed_year ? formatNumber(p.diagnosed_year, lang).replace(/,/g, "") : ""} />
            <Row k={t("ওজন", "Weight")} v={p?.weight_kg ? `${formatNumber(Number(p.weight_kg), lang)} kg` : ""} />
            <Row k="BMI" v={b ? formatNumber(b, lang) : ""} />
            <Row k={t("৩০ দিনের গড় সুগার", "30-day avg sugar")} v={g(info.avgAll)} />
            <Row k={t("খালি পেটে গড়", "Fasting avg")} v={g(info.avgFasting)} />
            <Row k={t("খাওয়ার পরে গড়", "After-meal avg")} v={g(info.avgAfter)} />
          </dl>
          <h3 className="mt-3 font-semibold">{t("ওষুধ", "Medicines")}</h3>
          <p className="whitespace-pre-line text-muted-foreground">{p?.medicines || "—"}</p>
          <h3 className="mt-3 font-semibold">{t("অন্য অসুখ / অ্যালার্জি", "Other conditions")}</h3>
          <p className="whitespace-pre-line text-muted-foreground">{p?.other_conditions || "—"}</p>
        </aside>
        <div className="min-w-0">
          <div className="flex flex-wrap items-end gap-4">
            <div><label htmlFor="kc" className="text-sm font-medium">{t("দিনে ক্যালরি", "Calories / day")}</label><input id="kc" inputMode="numeric" value={cal} onChange={(e) => setCalories(e.target.value.replace(/\D/g, ""))} placeholder="1600" className="mt-1 block w-32 rounded-md border border-input bg-card px-3 py-2" /></div>
            <button onClick={() => { if (confirm(t("সাধারণ তালিকা দিয়ে সব ঘর ভরে দেবেন? আগের লেখা মুছে যাবে।", "Fill every cell with the standard plan? Current text will be replaced."))) setCells(standardCells()); }} className="rounded-md border border-border px-3 py-2 text-sm text-primary hover:bg-secondary">{t("সাধারণ তালিকা থেকে শুরু করুন", "Start from standard plan")}</button>
            {(templates ?? []).length > 0 && (
              <select aria-label={t("সংরক্ষিত তালিকা থেকে নিন", "Load a saved chart")} value="" onChange={(e) => { const tp = templates!.find((x) => x.id === e.target.value); if (tp && confirm(t("এই তালিকা দিয়ে সব ঘর ভরে দেবেন?", "Fill every cell from this chart?"))) { setCells(normalizeCells(tp.cells)); if (tp.calories) setCalories(String(tp.calories)); if (tp.notes) setNotes(tp.notes); } }} className="rounded-md border border-border bg-card px-3 py-2 text-sm">
                <option value="">{t("সংরক্ষিত তালিকা থেকে নিন…", "Load a saved chart…")}</option>
                {templates!.map((tp) => <option key={tp.id} value={tp.id}>{tp.title}{tp.is_public ? "" : ` (${t("গোপন", "private")})`}</option>)}
              </select>
            )}
          </div>
          <label htmlFor="nt" className="mt-4 block text-sm font-medium">{t("রোগীর জন্য বিশেষ নির্দেশনা", "Special instructions for the patient")}</label>
          <textarea id="nt" rows={3} value={nt} onChange={(e) => setNotes(e.target.value)} maxLength={1500} placeholder={t("যেমন: ভাত দিনে এক বেলা, মিষ্টি ফল এড়িয়ে চলুন, রাতে হাঁটবেন", "e.g. rice once a day, avoid sweet fruit, walk after dinner")} className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2" />
          <div className="mt-4"><PlanTable cells={c} onChange={(m, d, cell) => { const next = c.map((r) => r.slice()); next[m]![d] = cell; setCells(next); }} /></div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button onClick={save} className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90">{t("খাদ্য তালিকা পাঠান", "Send diet plan")}</button>
            {msg && <p className={msg.includes("—") ? "text-destructive" : "text-glucose-ok"}>{msg}</p>}
          </div>
        </div>
      </div>
    </RoleShell>
  );
}
