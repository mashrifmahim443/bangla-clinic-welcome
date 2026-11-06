export type DiabetesType = "type1" | "type2" | "gestational" | "prediabetes" | "unsure";
export const diabetesTypes: Record<DiabetesType, [string, string]> = {
  type1: ["টাইপ ১", "Type 1"],
  type2: ["টাইপ ২", "Type 2"],
  gestational: ["গর্ভকালীন ডায়াবেটিস", "Gestational"],
  prediabetes: ["প্রি-ডায়াবেটিস", "Pre-diabetes"],
  unsure: ["এখনো জানি না", "Not sure yet"],
};
/** Age in whole years using the Dhaka calendar year. */
export function ageFromBirthYear(birthYear: number | null | undefined, now = new Date()) {
  if (!birthYear) return null;
  const y = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", year: "numeric" }).format(now));
  return y - birthYear;
}

/** Minimum profile completion (percent) before a patient can book a doctor. Mirrors public.profile_completion(). */
export const MIN_COMPLETION = 60;
export const COMPLETION_FIELDS = ["full_name", "phone", "address", "birth_year", "gender", "diabetes_type", "diagnosed_year", "medicines", "weight_kg", "height_cm"] as const;
export type CompletionProfile = Partial<Record<(typeof COMPLETION_FIELDS)[number], string | number | null>>;
export function profileCompletion(p: CompletionProfile | null | undefined) {
  if (!p) return 0;
  const filled = COMPLETION_FIELDS.filter((k) => {
    const v = p[k];
    return v !== null && v !== undefined && String(v).trim() !== "";
  }).length;
  return filled * 10;
}
