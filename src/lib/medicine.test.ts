import { describe, expect, it } from "vitest";
import { medicineTimingSelection, medicineTimingText, selectMedicineTiming, type RxItem } from "./medicine";

const item: RxItem = { name: "Medicine A", dose: "1", timing: "", duration: "7 days", comment: "Keep this note" };

describe("per-medicine instructions", () => {
  it("stores the selected meal timing and keeps this medicine's comment", () => {
    const selected = selectMedicineTiming(item, "after_breakfast");
    expect(selected.timingPreset).toBe("after_breakfast");
    expect(selected.timing).toBe("সকালের খাবার পরে");
    expect(selected.comment).toBe("Keep this note");
    expect(medicineTimingText(selected, (_bn, en) => en)).toBe("After breakfast");
  });
  it("preserves custom instructions and comments through saving and reopening", () => {
    const custom = { ...selectMedicineTiming(item, "custom"), timing: "খাবারের ২০ মিনিট আগে", comment: "পানি দিয়ে খাবেন" };
    const reopened: RxItem = JSON.parse(JSON.stringify(custom));
    expect(medicineTimingSelection(reopened)).toBe("custom");
    expect(medicineTimingText(reopened, (bn) => bn)).toBe("খাবারের ২০ মিনিট আগে");
    expect(reopened.comment).toBe("পানি দিয়ে খাবেন");
  });
  it("keeps older free-text timings without changing them", () => {
    const old = { ...item, timing: "Every 8 hours" };
    expect(medicineTimingSelection(old)).toBe("custom");
    expect(medicineTimingText(old, (bn) => bn)).toBe("Every 8 hours");
  });
  it("updates only the selected medicine", () => {
    const medicines = [item, { ...item, name: "Medicine B", comment: "Separate note" }];
    const updated = medicines.map((medicine, index) => index === 0 ? selectMedicineTiming(medicine, "bedtime") : medicine);
    expect(updated[0].timingPreset).toBe("bedtime");
    expect(updated[1].timing).toBe("");
    expect(updated[1].comment).toBe("Separate note");
  });
});