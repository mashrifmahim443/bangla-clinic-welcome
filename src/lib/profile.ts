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
