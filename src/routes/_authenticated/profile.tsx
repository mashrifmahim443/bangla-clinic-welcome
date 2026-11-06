import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatNumber } from "@/lib/locale";
import { MIN_COMPLETION, ageFromBirthYear, diabetesTypes, profileCompletion, type DiabetesType } from "@/lib/profile";
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
      const { data, error } = await supabase.from("profiles").select("full_name, phone, diabetes_type, birth_year, gender, address, diagnosed_year, medicines, weight_kg, height_cm, other_conditions, emergency_contact").eq("id", u.user!.id).maybeSingle();
      if (error) throw error;
      return { id: u.user!.id, ...data };
    },
  });
  const [form, setForm] = useState<Partial<Record<"full_name" | "phone" | "diabetes_type" | "birth_year" | "gender" | "address" | "diagnosed_year" | "medicines" | "weight_kg" | "height_cm" | "other_conditions" | "emergency_contact", string>>>({});
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  if (isLoading || !data) return <p className="p-10 text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p>;
  const v = {
    full_name: form.full_name ?? data.full_name ?? "",
    phone: form.phone ?? data.phone ?? "",
    diabetes_type: form.diabetes_type ?? data.diabetes_type ?? "",
    birth_year: form.birth_year ?? (data.birth_year ? String(data.birth_year) : ""),
    gender: form.gender ?? data.gender ?? "",
    address: form.address ?? data.address ?? "",
    diagnosed_year: form.diagnosed_year ?? (data.diagnosed_year ? String(data.diagnosed_year) : ""),
    medicines: form.medicines ?? data.medicines ?? "",
    weight_kg: form.weight_kg ?? (data.weight_kg ? String(data.weight_kg) : ""),
    height_cm: form.height_cm ?? (data.height_cm ? String(data.height_cm) : ""),
    other_conditions: form.other_conditions ?? data.other_conditions ?? "",
    emergency_contact: form.emergency_contact ?? data.emergency_contact ?? "",
  };
  const pct = profileCompletion(v);
  const set = (k: keyof typeof v, val: string) => { setForm({ ...form, [k]: val }); setSaved(false); };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    const phone = bnDigits(v.phone).replace(/\D/g, "");
    const by = Number(bnDigits(v.birth_year));
    if (!v.full_name.trim()) er["full_name"] = t("আপনার নাম লিখুন।", "Enter your name.");
    if (phone && phone.length !== 11) er["phone"] = t("ফোন নম্বর ১১ ডিজিটের হতে হবে।", "Phone number must be 11 digits.");
    if (v.birth_year && (!by || by < 1920 || by > 2015)) er["birth_year"] = t("জন্মসাল ১৯২০ থেকে ২০১৫-এর মধ্যে লিখুন, যেমন ১৯৬৫।", "Enter a birth year between 1920 and 2015, e.g. 1965.");
    const dy = Number(bnDigits(v.diagnosed_year));
    const wt = Number(bnDigits(v.weight_kg).replace(",", "."));
    const ht = Number(bnDigits(v.height_cm).replace(",", "."));
    const nowY = new Date().getFullYear();
    if (v.diagnosed_year && (!dy || dy < 1930 || dy > nowY)) er["diagnosed_year"] = t(`সালটা ১৯৩০ থেকে ${formatNumber(nowY, "bn")}-এর মধ্যে লিখুন, যেমন ২০১৫।`, `Enter a year between 1930 and ${nowY}, e.g. 2015.`);
    if (v.weight_kg && (!wt || wt < 20 || wt > 250)) er["weight_kg"] = t("ওজন ২০ থেকে ২৫০ কেজির মধ্যে লিখুন।", "Enter a weight between 20 and 250 kg.");
    if (v.height_cm && (!ht || ht < 90 || ht > 230)) er["height_cm"] = t("উচ্চতা ৯০ থেকে ২৩০ সেমির মধ্যে লিখুন।", "Enter a height between 90 and 230 cm.");
    setErrs(er);
    if (Object.keys(er).length) return;
    const { error } = await supabase.from("profiles").update({
      full_name: v.full_name.trim(), phone: phone || null,
      diabetes_type: (v.diabetes_type || null) as DiabetesType | null,
      birth_year: v.birth_year ? by : null, gender: v.gender || null,
      address: v.address.trim() || null, diagnosed_year: v.diagnosed_year ? dy : null,
      medicines: v.medicines.trim() || null, weight_kg: v.weight_kg ? wt : null, height_cm: v.height_cm ? ht : null,
      other_conditions: v.other_conditions.trim() || null, emergency_contact: v.emergency_contact.trim() || null,
    }).eq("id", data!.id);
    if (error) return setErrs({ form: t("সংরক্ষণ হয়নি। আবার চেষ্টা করুন।", "Couldn't save. Try again.") });
    setSaved(true); setForm({});
    qc.invalidateQueries({ queryKey: ["my-profile"] });
    qc.invalidateQueries({ queryKey: ["my-profile-completion"] });
  }
  const age = ageFromBirthYear(v.birth_year ? Number(bnDigits(v.birth_year)) : null);
  const field = "mt-1 w-full rounded-md border border-input bg-card px-3 py-3 text-lg";
  const Err = ({ k }: { k: string }) => (errs[k] ? <p className="mt-1 text-destructive">{errs[k]}</p> : null);
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Link to="/dashboard" className="text-primary underline underline-offset-4">{t("← ফিরে যান", "← Back")}</Link>
      <h1 className="mt-6 font-display text-3xl font-semibold">{t("আমার তথ্য", "My details")}</h1>
      <p className="mt-1 text-muted-foreground">{t("ডাক্তার এই তথ্য দেখে আপনাকে ঠিক পরামর্শ দেবেন।", "Your doctor uses this to give you the right advice.")}</p>
      <div className="mt-6 rounded-[10px] border border-border bg-card p-4">
        <p className="font-medium">{t(`প্রোফাইল ${formatNumber(pct, "bn")}% পূরণ হয়েছে`, `Profile ${pct}% complete`)}</p>
        <div className="mt-2 h-2 w-full rounded-sm bg-secondary"><div className={`h-2 rounded-sm ${pct >= MIN_COMPLETION ? "bg-glucose-ok" : "bg-accent"}`} style={{ width: `${pct}%` }} /></div>
        <p className="mt-2 text-muted-foreground">{pct >= MIN_COMPLETION ? t("এখন ডাক্তার দেখাতে পারবেন।", "You can now book a doctor.") : t(`ডাক্তার দেখাতে অন্তত ${formatNumber(MIN_COMPLETION, "bn")}% পূরণ করতে হবে।`, `Fill at least ${MIN_COMPLETION}% to book a doctor.`)}</p>
      </div>
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
        <div><label htmlFor="ad" className="font-medium">{t("ঠিকানা", "Address")}</label><textarea id="ad" rows={2} className={field} value={v.address} onChange={(e) => set("address", e.target.value)} placeholder={t("বাসা, এলাকা, জেলা", "House, area, district")} maxLength={300} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="wt" className="font-medium">{t("ওজন (কেজি)", "Weight (kg)")}</label><input id="wt" inputMode="decimal" className={field} value={v.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} placeholder="৬৫" /><Err k="weight_kg" /></div>
          <div><label htmlFor="ht" className="font-medium">{t("উচ্চতা (সেমি)", "Height (cm)")}</label><input id="ht" inputMode="decimal" className={field} value={v.height_cm} onChange={(e) => set("height_cm", e.target.value)} placeholder="১৬০" /><Err k="height_cm" /></div>
        </div>
        <div>
          <label htmlFor="dy" className="font-medium">{t("কোন সালে ডায়াবেটিস ধরা পড়েছে", "Year diabetes was found")}</label>
          <input id="dy" inputMode="numeric" className={field} value={v.diagnosed_year} onChange={(e) => set("diagnosed_year", e.target.value)} placeholder="২০১৫" />
          {Number(bnDigits(v.diagnosed_year)) > 1900 && <p className="mt-1 text-muted-foreground">{t("প্রায়", "About")} {formatNumber(Math.max(0, new Date().getFullYear() - Number(bnDigits(v.diagnosed_year))), lang)} {t("বছর ধরে", "years")}</p>}
          <Err k="diagnosed_year" />
        </div>
        <div><label htmlFor="md" className="font-medium">{t("এখন যে ওষুধ খাচ্ছেন", "Medicines you take now")}</label><textarea id="md" rows={3} className={field} value={v.medicines} onChange={(e) => set("medicines", e.target.value)} placeholder={t("যেমন: মেটফরমিন ৫০০ — সকাল ও রাতে খাবারের পরে; ইনসুলিন ১০ ইউনিট রাতে", "e.g. Metformin 500 — after breakfast and dinner; insulin 10 units at night")} maxLength={1000} /></div>
        <div><label htmlFor="oc" className="font-medium">{t("অন্য অসুখ বা অ্যালার্জি (থাকলে)", "Other illnesses or allergies (if any)")}</label><textarea id="oc" rows={2} className={field} value={v.other_conditions} onChange={(e) => set("other_conditions", e.target.value)} placeholder={t("যেমন: উচ্চ রক্তচাপ, কিডনির সমস্যা", "e.g. high blood pressure, kidney problem")} maxLength={500} /></div>
        <div><label htmlFor="ec" className="font-medium">{t("জরুরি যোগাযোগ (নাম ও নম্বর)", "Emergency contact (name and number)")}</label><input id="ec" className={field} value={v.emergency_contact} onChange={(e) => set("emergency_contact", e.target.value)} placeholder={t("যেমন: ছেলে করিম, ০১৮১১০০০০০০", "e.g. son Karim, 01811000000")} maxLength={150} /></div>
        <Err k="form" />
        <button className="w-full rounded-md bg-primary px-4 py-3 text-lg font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">{t("তথ্য সংরক্ষণ করুন", "Save details")}</button>
        {saved && <p className="text-glucose-ok">{t("সংরক্ষণ হয়েছে।", "Saved.")}</p>}
      </form>
      <p className="mt-6 text-muted-foreground">{t("লেখা ছোট লাগলে:", "If the text feels small:")} <TextSizeToggle className="text-primary underline underline-offset-4" /></p>
    </main>
  );
}
