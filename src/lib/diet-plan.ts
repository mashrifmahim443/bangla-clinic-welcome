import { plan, type GI } from "./diet";

/** One cell of a doctor-written weekly plan: free text food + portion, with GI tag. */
export type PlanCell = { food: string; portion: string; gi: GI | "" };
/** cells[mealIndex][dayIndex] — 5 meals x 7 days, same layout as the public diet chart. */
export type PlanCells = PlanCell[][];

export const emptyCells = (): PlanCells => Array.from({ length: 5 }, () => Array.from({ length: 7 }, () => ({ food: "", portion: "", gi: "" as const })));
export const standardCells = (): PlanCells => plan.map((row) => row.map((c) => ({ food: c.bn, portion: c.portionBn, gi: c.gi })));
export function normalizeCells(raw: unknown): PlanCells {
  const base = emptyCells();
  if (!Array.isArray(raw)) return base;
  return base.map((row, m) => row.map((cell, d) => ({ ...cell, ...((raw[m] as PlanCell[] | undefined)?.[d] ?? {}) })));
}
export function bmi(weightKg: number | null | undefined, heightCm: number | null | undefined) {
  if (!weightKg || !heightCm) return null;
  return Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10;
}
