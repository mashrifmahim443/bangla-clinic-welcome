import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatNumber } from "@/lib/locale";
import { ageFromBirthYear, diabetesTypes, type DiabetesType } from "@/lib/profile";
import { TextSizeToggle } from "@/components/site/text-size-toggle";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My details — DiabeCare" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

const bnDigits = (s: string) => s.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));

function Page() {
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("profiles").select("full_name, phone, diabetes_type, birth_year, gender").eq("id", u.user!.id).maybeSingle();
      if (error) throw error;
      return { id: u.user!.id, ...data };
    },
  });
  const [form, setForm] = useState<{ full_name?: string; phone?: string; diabetes_type?: DiabetesType | ""; birth_year?: string; gender?: string }>({});
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  if (isLoading || !data) return <p className="p-10 text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p>;
  const v = {
    full_name: form.full_name ?? data.full_name ?? "",
    phone: form.phone ?? data.phone ?? "",
    diabetes_type: form.diabetes_type ?? data.diabetes_type ?? "",
    birth_year: form.birth_year ?? (data.birth_year ? String(data.birth_year) : ""),
    gender: form.gender ?? data.gender ?? "",
  };
  const set = (k: keyof typeof v, val: string) => { setForm({ ...form, [k]: val }); setSaved(false); };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    const phone = bnDigits(v.phone).replace(/\D/g, "");
    const by = Number(bnDigits(v.birth_year));
    if (!v.full_name.trim()) er["full_name"] = t("আপনার নাম লিখুন।", "Enter your name.");
    if (phone && phone.length !== 11) er["phone"] = t("ফোন নম্বর ১১ ডিজিটের হতে হবে।", "Phone number must be 11 digits.");
    if (v.birth_year && (!by || by < 1920 || by > 2015)) er["birth_year"] = t("জন্মসাল ১৯২০ থেকে ২০১৫-এর মধ্যে লিখুন, যেমন ১৯৬৫।", "Enter a birth year between 1920 and 2015, e.g. 1965.");
    setErrs(er);
    if (Object.keys(er).length) return;
    const { error } = await supabase.from("profiles").update({
      full_name: v.full_name.trim(), phone: phone || null,
      diabetes_type: (v.diabetes_type || null) as DiabetesType | null,
      birth_year: v.birth_year ? by : null, gender: v.gender || null,
    }).eq("id", data!.id);
    if (error) return setErrs({ form: t("সংরক্ষণ হয়নি। আবার চেষ্টা করুন।", "Couldn't save. Try again.") });
    setSaved(true); setForm({});
    qc.invalidateQueries({ queryKey: ["my-profile"] });
  }
  const age = ageFromBirthYear(v.birth_year ? Number(bnDigits(v.birth_year)) : null);
  const field = "mt-1 w-full rounded-md border border-input bg-card px-3 py-3 text-lg";
  const Err = ({ k }: { k: string }) => (errs[k] ? <p className="mt-1 text-destructive">{errs[k]}</p> : null);
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Link to="/dashboard" className="text-primary underline underline-offset-4">{t("← ফিরে যান", "← Back")}</Link>
      <h1 className="mt-6 font-display text-3xl font-semibold">{t("আমার তথ্য", "My details")}</h1>
      <p className="mt-1 text-muted-foreground">{t("ডাক্তার এই তথ্য দেখে আপনাকে ঠিক পরামর্শ দেবেন।", "Your doctor uses this to give you the right advice.")}</p>
      <form onSubmit={save} className="mt-8 space-y-6 rounded-[10px] border border-border bg-card p-6">
        <div><label htmlFor="n" className="font-medium">{t("নাম", "Name")}</label><input id="n" className={field} value={v.full_name} onChange={(e) => set("full_name", e.target.value)} maxLength={100} /><Err k="full_name" /></div>
        <div><label htmlFor="p" className="font-medium">{t("মোবাইল নম্বর", "Mobile number")}</label><input id="p" inputMode="tel" className={field} value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="০১৭১১০০০০০০" /><Err k="phone" /></div>
        <fieldset>
          <legend className="font-medium">{t("ডায়াবেটিসের ধরন", "Type of diabetes")}</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(Object.keys(diabetesTypes) as DiabetesType[]).map((k) => (
              <label key={k} className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-3 text-lg ${v.diabetes_type === k ? "border-primary bg-secondary" : "border-border"}`}>
                <input type="radio" name="dt" checked={v.diabetes_type === k} onChange={() => set("diabetes_type", k)} className="h-5 w-5 accent-[var(--primary)]" />
                {t(...diabetesTypes[k])}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="by" className="font-medium">{t("জন্মসাল", "Birth year")}</label>
          <input id="by" inputMode="numeric" className={field} value={v.birth_year} onChange={(e) => set("birth_year", e.target.value)} placeholder="১৯৬৫" />
          {age !== null && age > 0 && age < 110 && <p className="mt-1 text-muted-foreground">{t("বয়স", "Age")}: {formatNumber(age, lang)} {t("বছর", "years")}</p>}
          <Err k="birth_year" />
        </div>
        <fieldset>
          <legend className="font-medium">{t("লিঙ্গ", "Gender")}</legend>
          <div className="mt-2 flex gap-6 text-lg">
            {[["m", t("পুরুষ", "Male")], ["f", t("নারী", "Female")]].map(([k, l]) => (
              <label key={k} className="flex items-center gap-2"><input type="radio" name="g" checked={v.gender === k} onChange={() => set("gender", k!)} className="h-5 w-5 accent-[var(--primary)]" />{l}</label>
            ))}
          </div>
        </fieldset>
        <Err k="form" />
        <button className="w-full rounded-md bg-primary px-4 py-3 text-lg font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">{t("তথ্য সংরক্ষণ করুন", "Save details")}</button>
        {saved && <p className="text-glucose-ok">{t("সংরক্ষণ হয়েছে।", "Saved.")}</p>}
      </form>
      <p className="mt-6 text-muted-foreground">{t("লেখা ছোট লাগলে:", "If the text feels small:")} <TextSizeToggle className="text-primary underline underline-offset-4" /></p>
    </main>
  );
}
