import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { specialties } from "@/lib/doctors";

export const Route = createFileRoute("/_authenticated/doctor-apply")({
  head: () => ({ meta: [{ title: "Join as a doctor — DiabeCare" }, { name: "robots", content: "noindex" }] }),
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
  const [f, setF] = useState({ name_bn: "", name_en: "", degrees: "", specialty: "diabetology", bmdc_no: "", fee: "", gender: "", phone: "" });
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
    if (!f.gender) er["gender"] = t("লিঙ্গ বেছে নিন।", "Choose a gender.");
    setErrs(er);
    if (Object.keys(er).length) return;
    const { error } = await supabase.from("doctor_applications").insert({
      name_bn: f.name_bn.trim(), name_en: f.name_en.trim(), degrees: f.degrees.trim(), specialty: f.specialty,
      bmdc_no: bmdc, fee_bdt: fee, gender: f.gender || null, phone: bnDigits(f.phone).replace(/\D/g, "") || null,
    });
    if (error) return setErrs({ form: t("আবেদন পাঠানো যায়নি। আবার চেষ্টা করুন।", "Couldn't send the application. Try again.") });
    qc.invalidateQueries({ queryKey: ["my-applications"] });
  }
  const field = "mt-1 w-full rounded-md border border-input bg-card px-3 py-2.5";
  const Err = ({ k }: { k: string }) => (errs[k] ? <p className="mt-1 text-sm text-destructive">{errs[k]}</p> : null);
  const input = (k: keyof typeof f, label: string, ph = "") => (
    <div><label htmlFor={k} className="font-medium">{label}</label><input id={k} className={field} value={f[k]} placeholder={ph} onChange={(e) => setF({ ...f, [k]: e.target.value })} /><Err k={k} /></div>
  );
  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <Link to="/dashboard" className="text-primary underline underline-offset-4">{t("← ফিরে যান", "← Back")}</Link>
      <h1 className="mt-6 font-display text-3xl font-semibold">{t("ডাক্তার হিসেবে যোগ দিন", "Join as a doctor")}</h1>
      <p className="mt-1 text-muted-foreground">{t("আমরা BMDC নিবন্ধন যাচাই করে সাধারণত ২ কর্মদিবসের মধ্যে জানাই।", "We check your BMDC registration and usually reply within 2 working days.")}</p>
      {apps.length > 0 && (
        <table className="mt-6 w-full border border-border bg-card text-sm">
          <tbody>
            {apps.map((a) => (
              <tr key={a.id} className="border-b border-border">
                <td className="p-3">BMDC {a.bmdc_no}</td>
                <td className={`p-3 ${a.status === "approved" ? "text-glucose-ok" : a.status === "rejected" ? "text-glucose-low" : "text-glucose-high"}`}>{t(statusText[a.status][0], statusText[a.status][1])}</td>
                <td className="p-3 text-muted-foreground">{a.admin_note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {approved ? (
        <p className="mt-6">{t("আপনার আবেদন অনুমোদিত হয়েছে।", "Your application is approved.")} <Link to="/doctor" className="text-primary underline underline-offset-4">{t("ডাক্তারের পাতায় যান", "Go to the doctor page")}</Link></p>
      ) : pending ? (
        <p className="mt-6">{t("আপনার আবেদন যাচাই চলছে। অনুমোদন হলে এখানেই দেখতে পাবেন।", "Your application is being checked. You'll see the result here.")}</p>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-5 rounded-[10px] border border-border bg-card p-6">
          {input("name_bn", t("নাম (বাংলায়)", "Name (Bangla)"), "ডা. রহিম উদ্দিন")}
          {input("name_en", t("নাম (ইংরেজিতে)", "Name (English)"), "Dr. Rahim Uddin")}
          {input("degrees", t("ডিগ্রি", "Degrees"), "MBBS, FCPS (Medicine)")}
          <div>
            <label htmlFor="sp" className="font-medium">{t("বিশেষত্ব", "Specialty")}</label>
            <select id="sp" className={field} value={f.specialty} onChange={(e) => setF({ ...f, specialty: e.target.value })}>
              {Object.entries(specialties).map(([k, [bn, en]]) => <option key={k} value={k}>{t(bn, en)}</option>)}
            </select>
          </div>
          {input("bmdc_no", t("BMDC নিবন্ধন নম্বর", "BMDC registration no."), "A-12345")}
          {input("fee", t("পরামর্শ ফি (টাকা)", "Consultation fee (taka)"), "৮০০")}
          {input("phone", t("মোবাইল নম্বর", "Mobile number"), "০১৭১১০০০০০০")}
          <fieldset>
            <legend className="font-medium">{t("লিঙ্গ", "Gender")}</legend>
            <div className="mt-2 flex gap-6">
              {[["male", t("পুরুষ", "Male")], ["female", t("নারী", "Female")]].map(([k, l]) => (
                <label key={k} className="flex items-center gap-2"><input type="radio" name="g" checked={f.gender === k} onChange={() => setF({ ...f, gender: k! })} />{l}</label>
              ))}
            </div>
          </fieldset>
          <Err k="gender" />
          <Err k="form" />
          <button className="w-full rounded-md bg-primary px-4 py-2.5 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">{t("আবেদন পাঠান", "Send application")}</button>
        </form>
      )}
    </main>
  );
}
