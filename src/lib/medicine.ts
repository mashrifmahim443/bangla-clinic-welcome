export const medicineTimings = [
  { value: "before_meal", bn: "খাবার আগে", en: "Before meals" },
  { value: "after_meal", bn: "খাবার পরে", en: "After meals" },
  { value: "with_meal", bn: "খাবারের সঙ্গে", en: "With meals" },
  { value: "before_breakfast", bn: "সকালের খাবার আগে", en: "Before breakfast" },
  { value: "after_breakfast", bn: "সকালের খাবার পরে", en: "After breakfast" },
  { value: "before_lunch", bn: "দুপুরের খাবার আগে", en: "Before lunch" },
  { value: "after_lunch", bn: "দুপুরের খাবার পরে", en: "After lunch" },
  { value: "before_dinner", bn: "রাতের খাবার আগে", en: "Before dinner" },
  { value: "after_dinner", bn: "রাতের খাবার পরে", en: "After dinner" },
  { value: "bedtime", bn: "ঘুমানোর আগে", en: "At bedtime" },
] as const;

export type RxItem = {
  name: string;
  dose: string;
  timing: string;
  duration: string;
  timingPreset?: string;
  comment?: string;
};

export function medicineTimingSelection(item: RxItem): string {
  if (item.timingPreset === "custom") return "custom";
  const preset = medicineTimings.find((option) => option.value === item.timingPreset);
  if (preset) return preset.value;
  const legacy = medicineTimings.find((option) => option.bn === item.timing || option.en === item.timing);
  return legacy?.value ?? (item.timing ? "custom" : "");
}

export function selectMedicineTiming(item: RxItem, value: string): RxItem {
  const preset = medicineTimings.find((option) => option.value === value);
  return { ...item, timingPreset: value, timing: preset?.bn ?? (value === "custom" ? item.timing : "") };
}

export function medicineTimingText(item: RxItem, t: (bn: string, en: string) => string): string {
  const preset = medicineTimings.find((option) => option.value === medicineTimingSelection(item));
  return preset ? t(preset.bn, preset.en) : item.timing;
}