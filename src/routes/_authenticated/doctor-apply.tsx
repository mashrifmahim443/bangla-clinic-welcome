import { pageHead } from "@/lib/appointments";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { specialties } from "@/lib/doctors";

export const Route = createFileRoute("/_authenticated/doctor-apply")({
  head: () => pageHead('Join as a doctor', 'Submit your BMDC registration and professional details to Diacare.'),
  component: Page,
});

const bnDigits = (s: string) => s.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)));
const statusText = { pending: ["যাচাই চলছে", "Under review"], approved: ["অনুমোদিত", "Approved"], rejected: ["অনুমোদন হয়নি", "Not approved"] } as const;

function Page() {
  const { t } = useLang();
  const qc = useQueryClient();
  const { data: apps = [] } = useQuery({
    queryKey: ["my-applications"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("doctor_applications").select("id, status, bmdc_no, admin_note, created_at").eq("user_id", u.user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [f, setF] = useState({ name_bn: "", name_en: "", degrees: "", specialty: "diabetology", bmdc_no: "", fee: "", gender: "", phone: "", whatsapp: "", email: "", address: "", designation: "", workplace: "", experience: "" });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const pending = apps.find((a) => a.status === "pending");
  const approved = apps.find((a) => a.status === "approved");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    const bmdc = bnDigits(f.bmdc_no.trim()).toUpperCase();
    const fee = Number(bnDigits(f.fee));
    if (!f.name_bn.trim()) er["name_bn"] = t("বাংলায় নাম লিখুন।", "Enter your name in Bangla.");
    if (!f.name_en.trim()) er["name_en"] = t("ইংরেজিতে নাম লিখুন।", "Enter your name in English.");
    if (!f.degrees.trim()) er["degrees"] = t("ডিগ্রি লিখুন, যেমন MBBS, FCPS (Medicine)।", "Enter degrees, e.g. MBBS, FCPS (Medicine).");
    if (!/^[A-Z]?-?\d{3,7}$/.test(bmdc)) er["bmdc_no"] = t("BMDC নম্বর ঠিক নেই। যেমন A-12345 বা 12345।", "BMDC number looks wrong. E.g. A-12345 or 12345.");
    if (!fee || fee < 100 || fee > 10000) er["fee"] = t("ফি ১০০ থেকে ১০,০০০ টাকার মধ্যে লিখুন।", "Enter a fee between 100 and 10,000 taka.");
    const phone = bnDigits(f.phone).replace(/\D/g, "");
    const wa = bnDigits(f.whatsapp).replace(/\D/g, "");
    const exp = Number(bnDigits(f.experience));
    if (!/^01\d{9}$/.test(phone)) er["phone"] = t("ফোন নম্বর ১১ ডিজিটের হতে হবে, ০১ দিয়ে শুরু।", "Phone must be 11 digits starting with 01.");
    if (!/^(88)?01\d{9}$/.test(wa)) er["whatsapp"] = t("হোয়াটসঅ্যাপ নম্বর ১১ ডিজিটের হতে হবে, ০১ দিয়ে শুরু।", "WhatsApp number must be 11 digits starting with 01.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) er["email"] = t("ইমেইল ঠিক নেই, যেমন name@gmail.com।", "Email looks wrong, e.g. name@gmail.com.");
    if (f.address.trim().length < 10) er["address"] = t("চেম্বার বা বাসার পুরো ঠিকানা লিখুন।", "Enter your full chamber or home address.");
    if (!f.designation.trim()) er["designation"] = t("বর্তমান পদবি লিখুন, যেমন সহকারী অধ্যাপক।", "Enter your current designation, e.g. Assistant Professor.");
    if (!f.workplace.trim()) er["workplace"] = t("কোথায় কর্মরত আছেন লিখুন।", "Enter where you currently work.");
    if (!f.experience || !Number.isInteger(exp) || exp < 0 || exp > 60) er["experience"] = t("অভিজ্ঞতা ০ থেকে ৬০ বছরের মধ্যে লিখুন।", "Enter experience between 0 and 60 years.");
    if (!f.gender) er["gender"] = t("লিঙ্গ বেছে নিন।", "Choose a gender.");
    setErrs(er);
    if (Object.keys(er).length) return;
    const { error } = await supabase.from("doctor_applications").insert({
      name_bn: f.name_bn.trim(), name_en: f.name_en.trim(), degrees: f.degrees.trim(), specialty: f.specialty,
      bmdc_no: bmdc, fee_bdt: fee, gender: f.gender || null, phone, whatsapp: wa.slice(-11), email: f.email.trim(), address: f.address.trim(), designation: f.designation.trim(), workplace: f.workplace.trim(), experience_years: exp,
    });
    if (error) return setErrs({ form: t("আবেদন পাঠানো যায়নি। আবার চেষ্টা করুন।", "Couldn't send the application. Try again.") });
    qc.invalidateQueries({ queryKey: ["my-applications"] });
  }
  const field = "mt-1 w-full rounded-md border border-input bg-card px-3 py-2.5";
  const Err = ({ k }: { k: string }) => (errs[k] ? <p className="mt-1 text-sm text-destructive">{errs[k]}</p> : null);
  const input = (k: keyof typeof f, label: string, ph = "") => (
    <div><label htmlFor={k} className="font-medium">{label} <span className="text-accent">*</span></label><input id={k} className={field} value={f[k]} placeholder={ph} onChange={(e) => setF({ ...f, [k]: e.target.value })} /><Err k={k} /></div>
  );
  const latest = apps[0];
  const steps: [string, string][] = [["আবেদন জমা", "Application sent"], ["BMDC যাচাই", "BMDC check"], ["অনুমোদন", "Approval"]];
  const stepAt = !latest ? 0 : latest.status === "pending" ? 1 : 3;
  const section = (n: string, title: string, note: string) => (
    <div className="flex items-baseline gap-3 border-b border-border pb-2 md:col-span-2">
      <span className="font-display text-2xl text-accent">{n}</span>
      <div><h2 className="font-display text-lg font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{note}</p></div>
    </div>
  );
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/dashboard" className="text-sm text-primary underline underline-offset-4">{t("← ফিরে যান", "← Back")}</Link>
      <header className="mt-5 border-b border-border pb-6">
        <h1 className="font-display text-3xl font-semibold md:text-4xl">{t("ডাক্তার হিসেবে যোগ দিন", "Join as a doctor")}</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">{t("আমরা BMDC নিবন্ধন যাচাই করে সাধারণত ২ কর্মদিবসের মধ্যে জানাই।", "We check your BMDC registration and usually reply within 2 working days.")}</p>
        <ol className="mt-6 grid grid-cols-3 border border-border bg-card text-sm">
          {steps.map(([bn, en], i) => {
            const done = i < stepAt, now = i === stepAt;
            return (
              <li key={en} className={`flex items-center gap-2 px-3 py-3 ${i > 0 ? "border-l border-border" : ""} ${now ? "bg-secondary" : ""}`}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-display ${done ? "border-primary bg-primary text-primary-foreground" : now ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{done ? "✓" : t(["১", "২", "৩"][i]!, String(i + 1))}</span>
                <span className={done || now ? "font-medium" : "text-muted-foreground"}>{t(bn, en)}</span>
              </li>
            );
          })}
        </ol>
      </header>

      {apps.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold">{t("আপনার আবেদন", "Your applications")}</h2>
          <div className="mt-3 rounded-[10px] border border-border bg-card">
            {apps.map((a, i) => {
              const c = a.status === "approved" ? ["border-glucose-ok text-glucose-ok", "bg-glucose-ok"] : a.status === "rejected" ? ["border-glucose-low text-glucose-low", "bg-glucose-low"] : ["border-glucose-high text-glucose-high", "bg-glucose-high"];
              return (
                <div key={a.id} className={`flex flex-wrap items-center gap-x-6 gap-y-1 px-5 py-4 ${i > 0 ? "border-t border-border" : ""}`}>
                  <div className="min-w-40"><p className="text-xs uppercase tracking-wide text-muted-foreground">BMDC</p><p className="font-display text-lg">{a.bmdc_no}</p></div>
                  <div className="min-w-32"><p className="text-xs uppercase tracking-wide text-muted-foreground">{t("জমার তারিখ", "Sent on")}</p><p>{new Date(a.created_at).toLocaleDateString(t("bn-BD", "en-GB"), { timeZone: "Asia/Dhaka", day: "numeric", month: "short", year: "numeric" })}</p></div>
                  <span className={`ml-auto inline-flex items-center gap-2 rounded-md border ${c[0]} px-3 py-1 text-sm font-medium`}><span className={`h-2 w-2 rounded-full ${c[1]}`} />{t(statusText[a.status][0], statusText[a.status][1])}</span>
                  {a.admin_note && <p className="w-full border-l-2 border-accent pl-3 text-sm text-muted-foreground">{a.admin_note}</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {approved ? (
        <div className="mt-6 rounded-[10px] border border-glucose-ok bg-card p-5">
          <p className="font-medium">{t("আপনার আবেদন অনুমোদিত হয়েছে।", "Your application is approved.")}</p>
          <Link to="/doctor" className="mt-3 inline-block rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">{t("ডাক্তারের পাতায় যান", "Go to the doctor page")}</Link>
        </div>
      ) : pending ? (
        <div className="mt-6 rounded-[10px] border border-border bg-card p-5">
          <p className="font-medium">{t("আপনার আবেদন যাচাই চলছে।", "Your application is being checked.")}</p>
          <p className="mt-1 text-muted-foreground">{t("অনুমোদন হলে এখানেই দেখতে পাবেন। দরকার হলে আমরা আপনার দেওয়া ফোন বা ইমেইলে যোগাযোগ করব।", "You'll see the result here. If we need anything, we'll contact you by the phone or email you gave.")}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 grid gap-5 rounded-[10px] border border-border bg-card p-6 md:grid-cols-2">
          <p className="text-sm text-muted-foreground md:col-span-2">{t("* চিহ্নিত সব ঘর পূরণ করা বাধ্যতামূলক।", "All fields marked * are required.")}</p>
          {section("১", t("পরিচয়", "Identity"), t("রোগীরা এই নাম দেখবেন।", "Patients will see this name."))}
          {input("name_bn", t("নাম (বাংলায়)", "Name (Bangla)"), "ডা. রহিম উদ্দিন")}
          {input("name_en", t("নাম (ইংরেজিতে)", "Name (English)"), "Dr. Rahim Uddin")}
          <fieldset className="md:col-span-2">
            <legend className="font-medium">{t("লিঙ্গ", "Gender")} <span className="text-accent">*</span></legend>
            <div className="mt-2 flex gap-3">
              {[["male", t("পুরুষ", "Male")], ["female", t("নারী", "Female")]].map(([k, l]) => (
                <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 transition-colors duration-150 ${f.gender === k ? "border-primary bg-secondary" : "border-input"}`}><input type="radio" name="g" className="accent-primary" checked={f.gender === k} onChange={() => setF({ ...f, gender: k! })} />{l}</label>
              ))}
            </div>
            <Err k="gender" />
          </fieldset>

          {section("২", t("পেশাগত তথ্য", "Professional details"), t("BMDC নম্বর দিয়ে আমরা যাচাই করি।", "We verify using your BMDC number."))}
          <div className="md:col-span-2">{input("degrees", t("সব ডিগ্রি (কমা দিয়ে)", "All degrees (comma separated)"), "MBBS, FCPS (Medicine), MD (Endocrinology)")}</div>
          <div>
            <label htmlFor="sp" className="font-medium">{t("বিশেষত্ব", "Specialty")} <span className="text-accent">*</span></label>
            <select id="sp" className={field} value={f.specialty} onChange={(e) => setF({ ...f, specialty: e.target.value })}>
              {Object.entries(specialties).map(([k, [bn, en]]) => <option key={k} value={k}>{t(bn, en)}</option>)}
            </select>
          </div>
          {input("bmdc_no", t("BMDC নিবন্ধন নম্বর", "BMDC registration no."), "A-12345")}
          {input("designation", t("বর্তমান পদবি", "Current designation"), t("সহকারী অধ্যাপক, এন্ডোক্রাইনোলজি", "Assistant Professor, Endocrinology"))}
          {input("workplace", t("কর্মস্থল", "Workplace"), t("ঢাকা মেডিকেল কলেজ হাসপাতাল", "Dhaka Medical College Hospital"))}
          {input("experience", t("অভিজ্ঞতা (বছর)", "Experience (years)"), "১০")}
          {input("fee", t("পরামর্শ ফি (৳)", "Consultation fee (৳)"), "৮০০")}

          {section("৩", t("যোগাযোগ", "Contact"), t("এগুলো রোগীরা দেখবেন না।", "Not shown to patients."))}
          {input("phone", t("মোবাইল নম্বর", "Mobile number"), "০১৭১১০০০০০০")}
          {input("whatsapp", t("হোয়াটসঅ্যাপ নম্বর", "WhatsApp number"), "০১৭১১০০০০০০")}
          <div className="md:col-span-2">{input("email", t("ইমেইল", "Email"), "name@gmail.com")}</div>
          <div className="md:col-span-2">{input("address", t("চেম্বার / ঠিকানা", "Chamber / address"), t("বাড়ি ১২, রোড ৫, ধানমন্ডি, ঢাকা", "House 12, Road 5, Dhanmondi, Dhaka"))}</div>

          <div className="border-t border-border pt-5 md:col-span-2">
            <Err k="form" />
            {Object.keys(errs).length > 0 && !errs["form"] && <p className="mb-3 text-sm text-destructive">{t("কিছু ঘর ঠিক করতে হবে, লাল লেখা দেখুন।", "Some fields need fixing — see the red notes.")}</p>}
            <button className="w-full rounded-md bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90 md:w-auto md:px-8">{t("আবেদন পাঠান", "Send application")}</button>
          </div>
        </form>
      )}
    </main>
  );
}
