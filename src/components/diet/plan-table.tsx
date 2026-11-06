import { days, meals, type GI } from "@/lib/diet";
import type { PlanCell, PlanCells } from "@/lib/diet-plan";
import { useLang } from "@/lib/i18n";

const giClass: Record<GI, string> = { low: "border-glucose-ok text-glucose-ok", medium: "border-glucose-high text-glucose-high", high: "border-glucose-low text-glucose-low" };
export const giLabel: Record<GI, [string, string]> = { low: ["কম GI", "Low GI"], medium: ["মাঝারি GI", "Medium GI"], high: ["বেশি GI", "High GI"] };

/** Printed-chart style weekly table. Pass onChange to make cells editable. */
export function PlanTable({ cells, onChange }: { cells: PlanCells; onChange?: (m: number, d: number, c: PlanCell) => void }) {
  const { t } = useLang();
  return (
    <div className="overflow-x-auto rounded-[10px] border border-border bg-card">
      <table className="w-full min-w-[900px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="w-32 px-3 py-2 font-normal text-muted-foreground">{t("বেলা", "Meal")}</th>
            {days.map((d) => <th key={d[1]} className="border-l border-border px-3 py-2 font-display font-semibold">{t(...d)}</th>)}
          </tr>
        </thead>
        <tbody>
          {meals.map((m, mi) => (
            <tr key={m[1]} className="border-b border-border last:border-0 align-top">
              <th className="px-3 py-3 font-medium">{t(m[0], m[1])}<div className="text-xs font-normal text-muted-foreground">{m[2]}</div></th>
              {days.map((_, di) => {
                const c = cells[mi]?.[di] ?? { food: "", portion: "", gi: "" };
                return (
                  <td key={di} className="border-l border-border px-2 py-2">
                    {onChange ? (
                      <div className="space-y-1">
                        <textarea rows={2} value={c.food} onChange={(e) => onChange(mi, di, { ...c, food: e.target.value })} placeholder={t("খাবার", "Food")} className="w-full resize-none rounded-md border border-input bg-background px-2 py-1" />
                        <input value={c.portion} onChange={(e) => onChange(mi, di, { ...c, portion: e.target.value })} placeholder={t("পরিমাণ", "Portion")} className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs" />
                        <select value={c.gi} onChange={(e) => onChange(mi, di, { ...c, gi: e.target.value as GI | "" })} className="w-full rounded-md border border-input bg-background px-1 py-1 text-xs">
                          <option value="">GI —</option>
                          {(Object.keys(giLabel) as GI[]).map((g) => <option key={g} value={g}>{t(...giLabel[g])}</option>)}
                        </select>
                      </div>
                    ) : c.food ? (
                      <>
                        <p className="font-medium whitespace-pre-line">{c.food}</p>
                        {c.portion && <p className="mt-0.5 text-xs text-muted-foreground">{c.portion}</p>}
                        {c.gi && <span className={`mt-1 inline-block rounded-sm border px-1.5 text-[11px] ${giClass[c.gi]}`}>{t(...giLabel[c.gi])}</span>}
                      </>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
