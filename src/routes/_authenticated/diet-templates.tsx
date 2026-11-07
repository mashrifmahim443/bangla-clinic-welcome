import { pageHead } from "@/lib/appointments";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PlanTable } from "@/components/diet/plan-table";
import { RoleShell } from "@/components/site/role-shell";
import { supabase } from "@/integrations/supabase/client";
import { normalizeCells, standardCells, type PlanCells } from "@/lib/diet-plan";
import { useDietTemplates, useMyDoctorId, useMyPatients } from "@/lib/diet-templates";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/diet-templates")({
  head: () => pageHead('Reusable diet charts', 'Manage private and shared DiabeCare doctor diet templates.'),
  component: Page,
});

type Draft = { id?: string; title: string; is_public: boolean; calories: string; notes: string; cells: PlanCells };

function Page() {
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const { data: myId, isLoading } = useMyDoctorId();
  const { data: list } = useDietTemplates();
  const { data: patients } = useMyPatients(myId);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [assign, setAssign] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  if (isLoading) return <RoleShell role="doctor"><p className="text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p></RoleShell>;
  if (!myId) return <RoleShell role="doctor"><p>{t("শুধু অনুমোদিত ডাক্তাররা খাদ্য তালিকা বানাতে পারবেন।", "Only approved doctors can make diet charts.")}</p></RoleShell>;

  const refresh = () => qc.invalidateQueries({ queryKey: ["diet-templates"] });
  async function save() {
    if (!draft) return;
    if (draft.title.trim().length < 3) return setMsg(t("তালিকার একটা নাম দিন (কমপক্ষে ৩ অক্ষর)। —", "Give the chart a name (at least 3 letters). —"));
    const kcal = draft.calories ? Number(draft.calories) : null;
    if (kcal !== null && (kcal < 800 || kcal > 4000)) return setMsg(t("ক্যালরি ৮০০ থেকে ৪০০০-এর মধ্যে লিখুন। —", "Calories must be 800–4000. —"));
    const row = { doctor_id: myId!, title: draft.title.trim(), is_public: draft.is_public, calories: kcal, notes: draft.notes.trim() || null, cells: draft.cells, updated_at: new Date().toISOString() };
    const { error } = draft.id ? await supabase.from("diet_templates").update(row).eq("id", draft.id) : await supabase.from("diet_templates").insert(row);
    if (error) return setMsg(`${error.message} —`);
    setMsg(t("খাদ্য তালিকা সংরক্ষণ হয়েছে।", "Diet chart saved.")); setDraft(null); refresh();
  }
  async function remove(id: string) {
    if (!confirm(t("এই খাদ্য তালিকা মুছবেন?", "Delete this diet chart?"))) return;
    await supabase.from("diet_templates").delete().eq("id", id); refresh();
  }
  async function give(tp: NonNullable<typeof list>[number]) {
    const pid = assign[tp.id]; const p = patients?.find((x) => x.id === pid);
    if (!p) return setMsg(t("আগে একজন রোগী বাছুন। —", "Pick a patient first. —"));
    const { error } = await supabase.from("diet_plans").upsert({ patient_id: p.id, doctor_id: myId!, appointment_id: p.appointmentId, cells: tp.cells, calories: tp.calories, notes: tp.notes, updated_at: new Date().toISOString() }, { onConflict: "patient_id,doctor_id" });
    setMsg(error ? `${error.message} —` : t(`${p.name}-কে খাদ্য তালিকা দেওয়া হয়েছে।`, `Diet chart given to ${p.name}.`));
  }

  return (
    <RoleShell role="doctor">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">{t("খাদ্য তালিকা", "Diet charts")}</h1>
          <p className="mt-1 text-muted-foreground">{t("নিজের তালিকা বানান। সবার জন্য খোলা রাখলে অন্য ডাক্তাররাও ব্যবহার করতে পারবেন; গোপন রাখলে শুধু আপনি।", "Make your own charts. Open ones can be used by every doctor; private ones only by you.")}</p>
        </div>
        {!draft && <button onClick={() => { setMsg(""); setDraft({ title: "", is_public: false, calories: "", notes: "", cells: standardCells() }); }} className="rounded-md bg-primary px-4 py-2.5 font-medium text-primary-foreground hover:bg-primary/90">{t("নতুন তালিকা বানান", "Make a new chart")}</button>}
      </div>
      {msg && <p className={`mt-3 ${msg.endsWith("—") ? "text-destructive" : "text-glucose-ok"}`}>{msg.replace(/ —$/, "")}</p>}

      {draft && (
        <section className="mt-5 rounded-[10px] border border-border bg-card p-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
            <div><label htmlFor="tt" className="text-sm font-medium">{t("তালিকার নাম", "Chart name")}</label><input id="tt" value={draft.title} maxLength={120} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder={t("যেমন: টাইপ ২, ওজন বেশি, ১৫০০ ক্যালরি", "e.g. Type 2, overweight, 1500 kcal")} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" /></div>
            <div><label htmlFor="tk" className="text-sm font-medium">{t("দিনে ক্যালরি", "Calories / day")}</label><input id="tk" inputMode="numeric" value={draft.calories} onChange={(e) => setDraft({ ...draft, calories: e.target.value.replace(/\D/g, "") })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" /></div>
          </div>
          <fieldset className="mt-4">
            <legend className="text-sm font-medium">{t("কে ব্যবহার করতে পারবেন", "Who can use it")}</legend>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              {[{ v: false, l: t("গোপন — শুধু আমি", "Private — only me") }, { v: true, l: t("সবার জন্য খোলা — সব ডাক্তার", "Open — all doctors") }].map((o) => (
                <label key={String(o.v)} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2.5 ${draft.is_public === o.v ? "border-primary bg-secondary" : "border-border"}`}>
                  <input type="radio" name="vis" checked={draft.is_public === o.v} onChange={() => setDraft({ ...draft, is_public: o.v })} />{o.l}
                </label>
              ))}
            </div>
          </fieldset>
          <label htmlFor="tn" className="mt-4 block text-sm font-medium">{t("বিশেষ নির্দেশনা", "Special instructions")}</label>
          <textarea id="tn" rows={2} value={draft.notes} maxLength={1500} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
          <div className="mt-4"><PlanTable cells={draft.cells} onChange={(m, d, cell) => { const next = draft.cells.map((r) => r.slice()); next[m]![d] = cell; setDraft({ ...draft, cells: next }); }} /></div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={save} className="rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90">{t("তালিকা সংরক্ষণ করুন", "Save chart")}</button>
            <button onClick={() => setDraft(null)} className="rounded-md border border-border px-4 py-2.5 hover:bg-secondary">{t("বাদ দিন", "Cancel")}</button>
          </div>
        </section>
      )}

      <ul className="mt-6 border-t border-foreground/80">
        {(list ?? []).length === 0 && <li className="py-6 text-muted-foreground">{t("এখনও কোনো তালিকা নেই।", "No charts yet.")}</li>}
        {(list ?? []).map((tp) => {
          const mine = tp.doctor_id === myId;
          const by = tp.doctors ? (lang === "bn" ? tp.doctors.name_bn : tp.doctors.name_en) : "";
          return (
            <li key={tp.id} className="border-b border-border py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{tp.title}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className={`mr-2 rounded-[4px] border px-1.5 py-0.5 text-xs ${tp.is_public ? "border-primary text-primary" : "border-border"}`}>{tp.is_public ? t("সবার জন্য খোলা", "Open") : t("গোপন", "Private")}</span>
                    {mine ? t("আমার তালিকা", "My chart") : by}{tp.calories ? ` · ${tp.calories} kcal` : ""}
                  </p>
                </div>
                {mine && (
                  <div className="flex gap-2">
                    <button onClick={() => { setMsg(""); setDraft({ id: tp.id, title: tp.title, is_public: tp.is_public, calories: tp.calories ? String(tp.calories) : "", notes: tp.notes ?? "", cells: normalizeCells(tp.cells) }); }} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary">{t("সম্পাদনা", "Edit")}</button>
                    <button onClick={() => remove(tp.id)} className="rounded-md border border-accent px-3 py-1.5 text-sm text-accent hover:bg-accent hover:text-accent-foreground">{t("মুছুন", "Delete")}</button>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select aria-label={t("রোগী", "Patient")} value={assign[tp.id] ?? ""} onChange={(e) => setAssign({ ...assign, [tp.id]: e.target.value })} className="min-w-0 flex-1 rounded-md border border-input bg-card px-3 py-2 sm:max-w-xs">
                  <option value="">{(patients ?? []).length ? t("রোগী বাছুন", "Pick a patient") : t("এখনও কোনো রোগী নেই", "No patients yet")}</option>
                  {(patients ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button onClick={() => give(tp)} className="rounded-md border border-primary px-3 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground">{t("রোগীকে দিন", "Give to patient")}</button>
              </div>
            </li>
          );
        })}
      </ul>
    </RoleShell>
  );
}
