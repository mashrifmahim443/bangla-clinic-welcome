import { pageHead } from "@/lib/appointments";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { RoleShell } from "@/components/site/role-shell";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatBDT } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/doctor-profile")({
  head: () => pageHead('My doctor profile', 'Manage your DiabeCare professional and private contact details.'),
  component: Page,
});

const bnDigits = (s: string) => s.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
type F = { degrees: string; designation: string; workplace: string; experience: string; phone: string; whatsapp: string; email: string; address: string };

function Page() {
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-doctor-profile"],
    queryFn: async () => {
      const uid = (await supabase.auth.getUser()).data.user!.id;
      const [{ data: d }, { data: c }] = await Promise.all([
        supabase.from("doctors").select("*").eq("user_id", uid).maybeSingle(),
        supabase.from("doctor_contacts").select("*").eq("user_id", uid).maybeSingle(),
      ]);
      return { uid, d, c };
    },
  });
  const [f, setF] = useState<Partial<F>>({});
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  if (isLoading || !data) return <RoleShell role="doctor"><p className="text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p></RoleShell>;
  const { d, c } = data;
  if (!d) return <RoleShell role="doctor"><p>{t("আপনার ডাক্তার প্রোফাইল পাওয়া যায়নি।", "Doctor profile not found.")}</p></RoleShell>;
  const v: F = {
    degrees: f.degrees ?? d.degrees, designation: f.designation ?? d.designation ?? "", workplace: f.workplace ?? d.workplace ?? "",
    experience: f.experience ?? (d.experience_years != null ? String(d.experience_years) : ""),
    phone: f.phone ?? c?.phone ?? "", whatsapp: f.whatsapp ?? c?.whatsapp ?? "", email: f.email ?? c?.email ?? "", address: f.address ?? c?.address ?? "",
  };
  const missing = (["degrees", "designation", "workplace", "experience", "phone", "whatsapp", "email", "address"] as const).filter((k) => !v[k].trim());

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    const phone = bnDigits(v.phone).replace(/\D/g, ""), wa = bnDigits(v.whatsapp).replace(/\D/g, "").slice(-11), exp = Number(bnDigits(v.experience));
    if (!v.degrees.trim()) er["degrees"] = t("ডিগ্রি লিখুন।", "Enter degrees.");
    if (!v.designation.trim()) er["designation"] = t("বর্তমান পদবি লিখুন।", "Enter designation.");
    if (!v.workplace.trim()) er["workplace"] = t("কর্মস্থল লিখুন।", "Enter workplace.");
    if (!v.experience || !Number.isInteger(exp) || exp < 0 || exp > 60) er["experience"] = t("অভিজ্ঞতা ০ থেকে ৬০ বছরের মধ্যে লিখুন।", "Experience must be 0–60 years.");
    if (!/^01\d{9}$/.test(phone)) er["phone"] = t("ফোন নম্বর ১১ ডিজিটের হতে হবে।", "Phone must be 11 digits.");
    if (!/^01\d{9}$/.test(wa)) er["whatsapp"] = t("হোয়াটসঅ্যাপ নম্বর ১১ ডিজিটের হতে হবে।", "WhatsApp must be 11 digits.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) er["email"] = t("ইমেইল ঠিক নেই।", "Email looks wrong.");
    if (v.address.trim().length < 10) er["address"] = t("পুরো ঠিকানা লিখুন।", "Enter the full address.");
    setErrs(er); setSaved(false);
    if (Object.keys(er).length) return;
    const r1 = await supabase.rpc("update_my_doctor_profile", { _degrees: v.degrees, _designation: v.designation, _workplace: v.workplace, _experience: exp });
    const r2 = c
      ? await supabase.from("doctor_contacts").update({ phone, whatsapp: wa, email: v.email.trim(), address: v.address.trim(), updated_at: new Date().toISOString() }).eq("user_id", data!.uid)
      : { error: { message: t("যোগাযোগের তথ্য অ্যাডমিন যোগ করবেন।", "Admin needs to add your contact record.") } };
    const err = r1.error ?? r2.error;
    if (err) return setErrs({ form: err.message });
    setF({}); setSaved(true); qc.invalidateQueries({ queryKey: ["my-doctor-profile"] });
  }
  const field = "mt-1 w-full rounded-md border border-input bg-card px-3 py-2.5";
  const inp = (k: keyof F, label: string, ph = "") => (
    <div><label htmlFor={k} className="font-medium">{label} <span className="text-accent">*</span></label>
      <input id={k} className={field} value={v[k]} placeholder={ph} onChange={(e) => { setF({ ...f, [k]: e.target.value }); setSaved(false); }} />
      {errs[k] && <p className="mt-1 text-sm text-destructive">{errs[k]}</p>}</div>
  );
  return (
    <RoleShell role="doctor">
      <h1 className="font-display text-3xl font-semibold">{t("আমার প্রোফাইল", "My profile")}</h1>
      {missing.length > 0 && <p className="mt-2 max-w-2xl rounded-md border border-accent px-3 py-2 text-accent">{t("কিছু বাধ্যতামূলক তথ্য বাকি আছে। নিচের * চিহ্নিত ঘরগুলো পূরণ করুন।", "Some required details are missing. Fill every field marked *.")}</p>}
      <div className="mt-5 grid max-w-4xl gap-6 lg:grid-cols-[1fr_16rem]">
        <form onSubmit={save} className="space-y-5 rounded-[10px] border border-border bg-card p-6">
          {inp("degrees", t("সব ডিগ্রি", "All degrees"), "MBBS, FCPS (Medicine)")}
          {inp("designation", t("বর্তমান পদবি", "Current designation"), t("সহকারী অধ্যাপক", "Assistant Professor"))}
          {inp("workplace", t("কর্মস্থল", "Workplace"))}
          {inp("experience", t("অভিজ্ঞতা (বছর)", "Experience (years)"), "১০")}
          <h2 className="border-t border-border pt-5 text-lg font-semibold">{t("যোগাযোগ (রোগীরা দেখবেন না)", "Contact (not shown to patients)")}</h2>
          {inp("phone", t("মোবাইল নম্বর", "Mobile number"), "০১৭১১০০০০০০")}
          {inp("whatsapp", t("হোয়াটসঅ্যাপ নম্বর", "WhatsApp number"), "০১৭১১০০০০০০")}
          {inp("email", t("ইমেইল", "Email"), "name@gmail.com")}
          {inp("address", t("চেম্বার / ঠিকানা", "Chamber / address"))}
          {errs["form"] && <p className="text-destructive">{errs["form"]}</p>}
          <button className="rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90">{t("প্রোফাইল সংরক্ষণ করুন", "Save profile")}</button>
          {saved && <p className="text-glucose-ok">{t("সংরক্ষণ হয়েছে।", "Saved.")}</p>}
        </form>
        <aside className="h-fit rounded-[10px] border border-border bg-card p-4 text-sm">
          <h2 className="font-semibold">{t("যাচাইকৃত তথ্য", "Verified details")}</h2>
          <p className="mt-1 text-muted-foreground">{t("এগুলো বদলাতে অ্যাডমিনের সাথে যোগাযোগ করুন।", "Contact admin to change these.")}</p>
          <dl className="mt-3 space-y-2">
            <div><dt className="text-muted-foreground">{t("নাম", "Name")}</dt><dd className="font-medium">{t(d.name_bn, d.name_en)}</dd></div>
            <div><dt className="text-muted-foreground">BMDC</dt><dd className="font-medium">{d.bmdc_no}</dd></div>
            <div><dt className="text-muted-foreground">{t("ফি", "Fee")}</dt><dd className="font-medium">{formatBDT(d.fee_bdt, lang)}</dd></div>
          </dl>
        </aside>
      </div>
    </RoleShell>
  );
}
