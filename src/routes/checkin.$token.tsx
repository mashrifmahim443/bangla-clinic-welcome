import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mealLabel, type Slot } from "@/lib/checkin";
import { glucoseState } from "@/lib/glucose";

export const Route = createFileRoute("/checkin/$token")({
  ssr: false,
  head: () => ({ meta: [{ title: "সুগার লিখুন — DiabeCare" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const bnDigits = (s: string) => s.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
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
  const [meds, setMeds] = useState<boolean | null>(null);
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const shell = (children: React.ReactNode) => (
    <main lang="bn" className="font-bn mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10 text-[22px]">{children}</main>
  );
  if (isLoading) return shell(<p className="text-center">একটু অপেক্ষা করুন…</p>);
  if (!data) return shell(<p className="text-center">এই লিংকের সময় শেষ হয়ে গেছে। পরের মেসেজের লিংকে লিখুন।</p>);
  if (data.used || step === 3) return shell(
    <div className="text-center">
      <p className="font-display text-4xl font-semibold text-primary">ধন্যবাদ{data.first_name ? `, ${data.first_name}` : ""}!</p>
      <p className="mt-4">আপনার সুগার লেখা হয়েছে। ডাক্তার দেখতে পাবেন।</p>
    </div>,
  );
  const meal = mealLabel[data.slot as Slot];

  async function submit() {
    const n = Number(bnDigits(value.trim()));
    if (!value.trim() || !Number.isInteger(n)) return setErr("শুধু সংখ্যা লিখুন, যেমন ১২০।");
    if (n < 20 || n > 600) return setErr("সংখ্যাটা ২০ থেকে ৬০০-এর মধ্যে হতে হবে।");
    setErr(""); setSaving(true);
    const { data: ok, error } = await supabase.rpc("submit_checkin", { _token: token, _ate: !!ate, _took_medicine: !!meds, _value: n });
    setSaving(false);
    if (error || !ok) return setErr("লেখা যায়নি। আবার চাপুন।");
    setStep(3);
  }

  const progress = <p className="mb-6 text-center text-lg text-muted-foreground">প্রশ্ন {["১", "২", "৩"][step]} / ৩</p>;
  const YesNo = ({ onPick }: { onPick: (v: boolean) => void }) => (
    <div className="mt-10 grid gap-4">
      <button onClick={() => onPick(true)} className={`${big} bg-primary text-primary-foreground hover:bg-primary/90`}>হ্যাঁ</button>
      <button onClick={() => onPick(false)} className={`${big} border-2 border-primary bg-card text-primary hover:bg-secondary`}>না</button>
    </div>
  );

  if (step === 0) return shell(<>{progress}<h1 className="text-center font-display text-4xl leading-tight font-semibold">{meal} খেয়েছেন?</h1><YesNo onPick={(v) => { setAte(v); setStep(1); }} /></>);
  if (step === 1) return shell(<>{progress}<h1 className="text-center font-display text-4xl leading-tight font-semibold">ওষুধ খেয়েছেন?</h1><YesNo onPick={(v) => { setMeds(v); setStep(2); }} /></>);
  const st = Number(bnDigits(value)) ? glucoseState(Number(bnDigits(value))) : null;
  return shell(
    <>
      {progress}
      <label htmlFor="v" className="block text-center font-display text-4xl leading-tight font-semibold">সুগার কত?</label>
      <div className="mt-10 flex items-center gap-3 rounded-md border-2 border-border bg-card px-4 focus-within:border-primary">
        <input id="v" inputMode="numeric" autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="১২০"
          className="w-full bg-transparent py-5 text-center text-5xl font-semibold outline-none" />
        <span className="text-2xl text-muted-foreground">mg/dL</span>
      </div>
      {st === "low" && <p className="mt-3 text-glucose-low">সুগার কম। এখনই একটু চিনি-পানি খান।</p>}
      {err && <p role="alert" className="mt-3 text-destructive">{err}</p>}
      <button onClick={submit} disabled={saving} className={`${big} mt-8 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60`}>{saving ? "লেখা হচ্ছে…" : "সুগার পাঠান"}</button>
      <button onClick={() => setStep(1)} className="mt-6 text-center text-lg text-primary underline underline-offset-4">আগের প্রশ্নে যান</button>
    </>,
  );
}
