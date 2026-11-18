import { pageHead } from "@/lib/appointments";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { saveContent, useCms, fileToDataUrl } from "@/lib/cms";
import { defaultExercises, type Ex } from "@/lib/exercise";

export const Route = createFileRoute("/_authenticated/admin/exercise")({ head: () => pageHead('Admin exercises', 'Edit Diacare exercise routines and images.'), component: Page });

const inp = "mt-0.5 w-full rounded-md border border-input bg-card px-2 py-1 text-sm";
const btn = "rounded-md border border-border bg-card px-2 py-1 transition-colors duration-150 hover:bg-secondary";
// Stored entries keep img "" when using the built-in drawing.
const strip = (list: Ex[]) => list.map((e) => ({ ...e, img: e.img.startsWith("data:") ? e.img : "" }));

function Page() {
  const { t } = useLang();
  const qc = useQueryClient();
  const saved = useCms().json<Ex[] | null>("exercise", null);
  const current = Array.isArray(saved) ? saved : strip(defaultExercises);
  const [list, setList] = useState<Ex[]>(current);
  const [msg, setMsg] = useState("");
  useEffect(() => setList(current), [saved]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (i: number, patch: Partial<Ex>) => setList(list.map((e, j) => (i === j ? { ...e, ...patch } : e)));
  const linesOf = (e: Ex, k: 0 | 1) => e.steps.map((s) => s[k]).join("\n");
  const setSteps = (i: number, k: 0 | 1, text: string) => {
    const e = list[i]!; const arr = text.split("\n");
    const n = Math.max(arr.length, e.steps.length);
    const steps = Array.from({ length: n }, (_, x) => { const s: [string, string] = [...(e.steps[x] ?? ["", ""])] as [string, string]; s[k] = arr[x] ?? ""; return s; }).filter((s) => s[0] || s[1]);
    set(i, { steps });
  };
  async function save(next: Ex[] | null) {
    const { error } = await saveContent("exercise", next);
    setMsg(error ? `${t("সংরক্ষণ হয়নি", "Not saved")}: ${error.message}` : t("সংরক্ষিত", "Saved"));
    qc.invalidateQueries({ queryKey: ["site-content"] });
  }
  const defaultImg = (i: number) => defaultExercises[i]?.img ?? defaultExercises[0]!.img;
  return (
    <div>
      <h1 className="text-lg font-semibold">{t("ব্যায়াম", "Exercises")}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => save(list)} className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">{t("সংরক্ষণ করুন", "Save")}</button>
        <button onClick={() => setList([...list, { img: "", titleBn: "", titleEn: "", whenBn: "", whenEn: "", steps: [] }])} className={btn}>{t("নতুন ব্যায়াম যোগ করুন", "Add an exercise")}</button>
        <button onClick={() => { setList(strip(defaultExercises)); save(null); }} className={btn}>{t("আগের অবস্থায় ফিরুন", "Restore original")}</button>
        {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
      </div>
      <div className="mt-4 space-y-4">
        {list.map((e, i) => (
          <section key={i} className="rounded-[10px] border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-display text-2xl text-accent">{i + 1}</span>
              <img src={e.img || defaultImg(i)} alt="" className="h-16 w-16 rounded-md border border-border object-cover" />
              <label className={`${btn} cursor-pointer`}>{t("ছবি বদলান", "Change picture")}<input type="file" accept="image/*" className="hidden" onChange={async (ev) => { const f = ev.target.files?.[0]; if (f) set(i, { img: await fileToDataUrl(f, 900) }); }} /></label>
              <button onClick={() => setList(list.filter((_, j) => j !== i))} className={`${btn} ml-auto text-glucose-low`}>{t("মুছুন", "Delete")}</button>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="block">{t("নাম (বাংলা)", "Name (Bangla)")}<input className={inp} value={e.titleBn} onChange={(ev) => set(i, { titleBn: ev.target.value })} /></label>
              <label className="block">{t("নাম (ইংরেজি)", "Name (English)")}<input className={inp} value={e.titleEn} onChange={(ev) => set(i, { titleEn: ev.target.value })} /></label>
              <label className="block">{t("কখন, কতবার (বাংলা)", "When, how often (Bangla)")}<input className={inp} value={e.whenBn} onChange={(ev) => set(i, { whenBn: ev.target.value })} /></label>
              <label className="block">{t("কখন, কতবার (ইংরেজি)", "When, how often (English)")}<input className={inp} value={e.whenEn} onChange={(ev) => set(i, { whenEn: ev.target.value })} /></label>
              <label className="block">{t("ধাপ, প্রতি লাইনে একটা (বাংলা)", "Steps, one per line (Bangla)")}<textarea rows={5} className={inp} value={linesOf(e, 0)} onChange={(ev) => setSteps(i, 0, ev.target.value)} /></label>
              <label className="block">{t("ধাপ, প্রতি লাইনে একটা (ইংরেজি)", "Steps, one per line (English)")}<textarea rows={5} className={inp} value={linesOf(e, 1)} onChange={(ev) => setSteps(i, 1, ev.target.value)} /></label>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
