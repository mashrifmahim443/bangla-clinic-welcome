import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mealLabel, type Slot } from "@/lib/checkin";
import { MAX_VALUE, MIN_VALUE, UNIT, glucoseState, parseGlucose } from "@/lib/glucose";

export const Route = createFileRoute("/checkin/$token")({
  ssr: false,
  head: () => ({ meta: [{ title: "সুগার লিখুন — Diacare" }, { name: "description", content: "Write your meal, medicine and glucose check-in for Diacare." }, { property: "og:title", content: "সুগার লিখুন — Diacare" }, { property: "og:description", content: "Write your meal, medicine and glucose check-in for Diacare." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const foodChoices: Record<Slot, string[]> = {
  morning: ["রুটি", "পরোটা", "ডিম", "সবজি", "ডাল", "চিড়া/মুড়ি", "চা", "ফল"],
  lunch: ["ভাত", "মাছ", "মুরগি", "ডাল", "সবজি", "শাক", "সালাদ", "মাংস"],
  dinner: ["রুটি", "ভাত", "মাছ", "মুরগি", "ডাল", "সবজি", "খিচুড়ি", "দুধ"],
};
const big = "w-full rounded-md py-6 text-3xl font-semibold transition-colors duration-150";

function Page() {
  const { token } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["checkin", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("checkin_info", { _token: token });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
  const [step, setStep] = useState(0);
  const [ate, setAte] = useState<boolean | null>(null);
  const [food, setFood] = useState<string[]>([]);
  const [foodText, setFoodText] = useState("");
  const [meds, setMeds] = useState<boolean | null>(null);
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const shell = (children: React.ReactNode) => (
    <main lang="bn" className="font-bn mx-auto flex min-h-screen max-w-md flex-col px-5 pt-16 pb-10 text-[22px]">{children}</main>
  );
  if (isLoading) return shell(<p>একটু অপেক্ষা করুন…</p>);
  if (!data) return shell(<p>এই লিংকের মেয়াদ শেষ হয়ে গেছে। পরের মেসেজে যে লিংক পাবেন, সেখানে লিখুন।</p>);
  if (data.used || step === 4) return shell(
    <div>
      <p className="font-display text-4xl font-semibold text-primary">ধন্যবাদ{data.first_name ? `, ${data.first_name}` : ""}!</p>
      <p className="mt-4">আপনার সুগার লেখা হয়েছে। ডাক্তার দেখতে পাবেন।</p>
    </div>,
  );
  const meal = mealLabel[data.slot as Slot];

  async function submit() {
    const n = parseGlucose(value);
    if (Number.isNaN(n)) return setErr("শুধু সংখ্যা লিখুন, যেমন ৬.২।");
    if (n < MIN_VALUE || n > MAX_VALUE) return setErr("সংখ্যাটা ১.১ থেকে ৩৩.৩-এর মধ্যে হতে হবে।");
    setErr(""); setSaving(true);
    const eaten = [...food, foodText.trim()].filter(Boolean).join(", ");
    const { data: ok, error } = await supabase.rpc("submit_checkin", { _token: token, _ate: !!ate, _took_medicine: !!meds, _value: n, ...(eaten ? { _food: eaten } : {}) });
    setSaving(false);
    if (error || !ok) return setErr("লেখা পাঠানো যায়নি। আবার চেষ্টা করুন।");
    setStep(4);
  }

  const progress = <p className="mb-6 text-lg text-muted-foreground">প্রশ্ন {["১", "২", "৩", "৪"][step]} / ৪</p>;
  const YesNo = ({ onPick }: { onPick: (v: boolean) => void }) => (
    <div className="mt-10 grid gap-4">
      <button onClick={() => onPick(true)} className={`${big} bg-primary text-primary-foreground hover:bg-primary/90`}>হ্যাঁ</button>
      <button onClick={() => onPick(false)} className={`${big} border-2 border-primary bg-card text-primary hover:bg-secondary`}>না</button>
    </div>
  );

  if (step === 0) return shell(<>{progress}<h1 className="font-display text-4xl leading-tight font-semibold">{meal} খেয়েছেন?</h1><YesNo onPick={(v) => { setAte(v); setStep(v ? 1 : 2); }} /></>);
  if (step === 1) return shell(
    <>
      {progress}
      <h1 className="font-display text-4xl leading-tight font-semibold">কী খেয়েছেন?</h1>
      <p className="mt-2 text-lg text-muted-foreground">যে খাবারগুলো খেয়েছেন, সেগুলো বেছে নিন।</p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {(foodChoices[data.slot as Slot] ?? []).map((f) => {
          const on = food.includes(f);
          return (
            <button key={f} aria-pressed={on} onClick={() => setFood(on ? food.filter((x) => x !== f) : [...food, f])}
              className={`rounded-md border-2 px-3 py-4 text-xl transition-colors duration-150 ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}>{f}</button>
          );
        })}
      </div>
      <label htmlFor="ft" className="mt-6 block text-lg">অন্য কিছু খেলে লিখুন</label>
      <input id="ft" value={foodText} maxLength={150} onChange={(e) => setFoodText(e.target.value)} placeholder="যেমন: দুটো রুটি"
        className="mt-2 w-full rounded-md border-2 border-border bg-card px-4 py-4 text-xl outline-none focus:border-primary" />
      <button onClick={() => setStep(2)} className={`${big} mt-8 bg-primary text-primary-foreground hover:bg-primary/90`}>পরের প্রশ্ন</button>
    </>,
  );
  if (step === 2) return shell(<>{progress}<h1 className="font-display text-4xl leading-tight font-semibold">ওষুধ খেয়েছেন?</h1><YesNo onPick={(v) => { setMeds(v); setStep(3); }} /></>);
  const parsed = parseGlucose(value);
  const st = Number.isNaN(parsed) ? null : glucoseState(parsed);
  return shell(
    <>
      {progress}
      <label htmlFor="v" className="block font-display text-4xl leading-tight font-semibold">সুগার কত?</label>
      <div className="mt-10 flex items-center gap-3 rounded-md border-2 border-border bg-card px-4 focus-within:border-primary">
        <input id="v" inputMode="decimal" autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="৬.২"
          className="w-full bg-transparent py-5 text-5xl font-semibold outline-none" />
        <span className="text-2xl text-muted-foreground">{UNIT}</span>
      </div>
      {st === "low" && <p className="mt-3 text-glucose-low">সুগার কম। এখনই একটু চিনি-পানি খান।</p>}
      {err && <p role="alert" className="mt-3 text-destructive">{err}</p>}
      <button onClick={submit} disabled={saving} className={`${big} mt-8 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60`}>{saving ? "লেখা হচ্ছে…" : "সুগার পাঠান"}</button>
      <button onClick={() => setStep(2)} className="mt-6 text-lg text-primary underline underline-offset-4">আগের প্রশ্নে যান</button>
    </>,
  );
}
