import { pageHead } from "@/lib/appointments";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import { saveContent, useCms } from "@/lib/cms";
import { days, meals, plan as defaultPlan, type Cell, type GI } from "@/lib/diet";

export const Route = createFileRoute("/_authenticated/admin/diet")({ head: () => pageHead('Admin diet chart', 'Edit the public Diacare weekly meal chart.'), component: Page });

const inp = "w-full rounded-sm border border-input bg-card px-1 py-0.5 text-xs";

function Page() {
  const { t } = useLang();
  const qc = useQueryClient();
  const saved = useCms().json<Cell[][] | null>("diet_plan", null);
  const current = Array.isArray(saved) && saved.length === 5 ? saved : defaultPlan;
  const [plan, setPlan] = useState<Cell[][]>(current);
  const [msg, setMsg] = useState("");
  useEffect(() => setPlan(current), [saved]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (r: number, c: number, patch: Partial<Cell>) => setPlan(plan.map((row, i) => (i !== r ? row : row.map((cell, j) => (j !== c ? cell : { ...cell, ...patch })))));
  async function save(next: Cell[][] | null) {
    const { error } = await saveContent("diet_plan", next);
    setMsg(error ? `${t("সংরক্ষণ হয়নি", "Not saved")}: ${error.message}` : t("সংরক্ষিত", "Saved"));
    qc.invalidateQueries({ queryKey: ["site-content"] });
  }
  return (
    <div>
      <h1 className="text-lg font-semibold">{t("সাপ্তাহিক খাদ্য তালিকা", "Weekly diet chart")}</h1>
      <p className="mt-1 text-muted-foreground">{t("প্রতি ঘরে খাবারের নাম, পরিমাণ (বাংলা ও ইংরেজি) আর GI দিন।", "In each square: food name, portion (Bangla and English) and GI.")}</p>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={() => save(plan)} className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">{t("তালিকা সংরক্ষণ করুন", "Save chart")}</button>
        <button onClick={() => { setPlan(defaultPlan); save(null); }} className="rounded-md border border-border bg-card px-2 py-1 transition-colors duration-150 hover:bg-secondary">{t("আগের তালিকায় ফিরুন", "Restore original")}</button>
        {msg && <span className="text-xs text-muted-foreground">{msg}</span>}
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-[1100px] border-collapse border border-border bg-card">
          <thead><tr className="bg-secondary"><th className="border border-border p-1" />{days.map(([bn, en]) => <th key={en} className="border border-border p-1 font-medium">{t(bn, en)}</th>)}</tr></thead>
          <tbody>
            {meals.map(([bn, en], r) => (
              <tr key={en}>
                <th className="border border-border p-1 text-left align-top font-medium">{t(bn, en)}</th>
                {(plan[r] ?? []).map((cell, c) => (
                  <td key={c} className="w-36 space-y-0.5 border border-border p-1 align-top">
                    <input className={inp} value={cell.bn} placeholder="খাবার" onChange={(e) => set(r, c, { bn: e.target.value })} />
                    <input className={inp} value={cell.en} placeholder="Food" onChange={(e) => set(r, c, { en: e.target.value })} />
                    <input className={inp} value={cell.portionBn} placeholder="পরিমাণ" onChange={(e) => set(r, c, { portionBn: e.target.value })} />
                    <input className={inp} value={cell.portionEn} placeholder="Portion" onChange={(e) => set(r, c, { portionEn: e.target.value })} />
                    <select className={inp} value={cell.gi} onChange={(e) => set(r, c, { gi: e.target.value as GI })}>
                      <option value="low">{t("কম GI", "Low GI")}</option><option value="medium">{t("মাঝারি GI", "Med GI")}</option><option value="high">{t("বেশি GI", "High GI")}</option>
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
