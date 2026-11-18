import { pageHead } from "@/lib/appointments";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatBDT } from "@/lib/locale";
import { SortableTable, type Col } from "@/components/admin/sortable-table";
import { doctorPhotos, specialties, statusInfo } from "@/lib/doctors";
import { fileToDataUrl } from "@/lib/cms";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/doctors")({ head: () => pageHead('Admin doctors', 'Manage Diacare doctor details and directory visibility.'), component: Page });

type D = Database["public"]["Tables"]["doctors"]["Row"];
type Form = { id?: string; slug: string; name_bn: string; name_en: string; degrees: string; specialty: string; bmdc_no: string; fee_bdt: string; gender: string; designation: string; workplace: string; experience_years: string; photo_url: string; status: D["status"]; active: boolean };
const blank: Form = { slug: "", name_bn: "", name_en: "", degrees: "", specialty: "diabetology", bmdc_no: "", fee_bdt: "", gender: "female", designation: "", workplace: "", experience_years: "", photo_url: "", status: "offline", active: true };
const toForm = (d: D): Form => ({ id: d.id, slug: d.slug, name_bn: d.name_bn, name_en: d.name_en, degrees: d.degrees, specialty: d.specialty, bmdc_no: d.bmdc_no, fee_bdt: String(d.fee_bdt), gender: d.gender, designation: d.designation ?? "", workplace: d.workplace ?? "", experience_years: d.experience_years?.toString() ?? "", photo_url: d.photo_url ?? "", status: d.status, active: d.active });
const btn = "rounded-md border border-border bg-card px-2 py-0.5 transition-colors duration-150 hover:bg-secondary";
const inp = "mt-0.5 w-full rounded-md border border-input bg-card px-2 py-1";

function Page() {
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [err, setErr] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: async () => { const { data, error } = await supabase.from("doctors").select("*").order("name_en"); if (error) throw error; return data; },
  });
  const refresh = () => { for (const key of ["admin-doctors", "home-doctors", "doctors", "doctor"]) void qc.invalidateQueries({ queryKey: [key] }); };

  async function update(d: D, patch: Partial<D>) {
    const { error } = await supabase.from("doctors").update(patch).eq("id", d.id);
    if (error) alert(`${t("বদলানো যায়নি।", "Couldn't update.")}\n${error.message}`);
    refresh();
  }
  async function remove(d: D) {
    if (!confirm(t(`${d.name_bn}-কে তালিকা থেকে সরাবেন?`, `Remove ${d.name_en} from the list?`))) return;
    const { error } = await supabase.from("doctors").delete().eq("id", d.id);
    if (error) alert(t("এই ডাক্তারের অ্যাপয়েন্টমেন্ট বা প্রেসক্রিপশন আছে, তাই মোছা যাবে না। তার বদলে 'স্থগিত করুন' চাপুন।", "This doctor has appointments or prescriptions, so they can't be removed. Use 'Suspend' instead."));
    refresh();
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const fee = Number(form.fee_bdt);
    if (!form.name_bn.trim() || !form.name_en.trim() || !form.degrees.trim() || !form.bmdc_no.trim()) return setErr(t("নাম, ডিগ্রি আর BMDC নম্বর লাগবে।", "Name, degrees and BMDC number are required."));
    if (!fee || fee < 0) return setErr(t("ফি ঠিক নেই।", "Fee looks wrong."));
    const slug = form.slug.trim() || form.name_en.toLowerCase().replace(/^dr\.?\s*/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `doctor-${Date.now()}`;
    const row = { slug, name_bn: form.name_bn.trim(), name_en: form.name_en.trim(), degrees: form.degrees.trim(), specialty: form.specialty, bmdc_no: form.bmdc_no.trim(), fee_bdt: fee, gender: form.gender, designation: form.designation.trim() || null, workplace: form.workplace.trim() || null, experience_years: form.experience_years ? Number(form.experience_years) : null, photo_url: form.photo_url || null, status: form.status, active: form.active };
    const { error } = form.id ? await supabase.from("doctors").update(row).eq("id", form.id) : await supabase.from("doctors").insert(row);
    if (error) return setErr(`${t("সংরক্ষণ হয়নি।", "Couldn't save.")} ${error.message}`);
    setForm(null); setErr(""); refresh();
  }
  async function pickPhoto(f: File | undefined) {
    if (!f || !form) return;
    setForm({ ...form, photo_url: await fileToDataUrl(f, 400) });
  }

  const cols: Col<D>[] = [
    { key: "photo", label: "", value: () => null, render: (d) => { const p = d.photo_url || doctorPhotos[d.slug]; return p ? <img src={p} alt="" className="h-9 w-9 rounded-md object-cover" /> : <span className="text-muted-foreground">—</span>; } },
    { key: "name", label: t("নাম", "Name"), value: (d) => (lang === "bn" ? d.name_bn : d.name_en) },
    { key: "badges", label: t("ব্যাজ", "Badges"), value: (d) => Number(d.is_verified) * 2 + Number(d.is_special), render: (d) => <div className="flex flex-col gap-2">
      <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={d.is_verified} onChange={e => update(d, { is_verified: e.target.checked })} />{t("যাচাইকৃত", "Verified")}</label>
      <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={d.is_special} onChange={e => update(d, { is_special: e.target.checked })} />{t("বিশেষ", "Special")}</label>
    </div> },
    { key: "deg", label: t("ডিগ্রি", "Degrees"), value: (d) => d.degrees },
    { key: "spec", label: t("বিশেষত্ব", "Specialty"), value: (d) => d.specialty, render: (d) => { const s = specialties[d.specialty]; return s ? t(s[0], s[1]) : d.specialty; } },
    { key: "bmdc", label: "BMDC", value: (d) => d.bmdc_no },
    { key: "fee", label: t("ফি", "Fee"), value: (d) => d.fee_bdt, render: (d) => formatBDT(d.fee_bdt, lang), align: "right" },
    { key: "status", label: t("অবস্থা", "Status"), value: (d) => d.status, render: (d) => (
      <select value={d.status} onChange={(e) => update(d, { status: e.target.value as D["status"] })} className="rounded-md border border-input bg-card px-1 py-0.5">
        {(["online", "busy", "offline"] as const).map((s) => <option key={s} value={s}>{t(statusInfo[s].bn, statusInfo[s].en)}</option>)}
      </select>
    ) },
    { key: "active", label: t("তালিকায়", "Listed"), value: (d) => (d.active ? 1 : 0), render: (d) => d.active ? <span className="text-glucose-ok">{t("দেখা যাচ্ছে", "Visible")}</span> : <span className="text-glucose-low">{t("স্থগিত", "Suspended")}</span> },
    { key: "actions", label: t("কাজ", "Actions"), value: () => null, render: (d) => (
      <span className="flex flex-wrap gap-1">
        <button onClick={() => { setForm(toForm(d)); setErr(""); }} className={btn}>{t("সম্পাদনা", "Edit")}</button>
        <button onClick={() => update(d, { active: !d.active })} className={`${btn} text-glucose-high`}>{d.active ? t("স্থগিত করুন", "Suspend") : t("আবার চালু", "Restore")}</button>
        <button onClick={() => remove(d)} className={`${btn} text-glucose-low`}>{t("সরান", "Remove")}</button>
      </span>
    ) },
  ];
  const fld = (k: keyof Form, label: string, type = "text") => (
    <label className="block">{label}<input type={type} className={inp} value={String(form![k] ?? "")} onChange={(e) => setForm({ ...form!, [k]: e.target.value })} /></label>
  );
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-lg font-semibold">{t("ডাক্তার", "Doctors")} <span className="font-normal text-muted-foreground">({data.length})</span></h1>
        <button onClick={() => { setForm({ ...blank }); setErr(""); }} className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">{t("নতুন ডাক্তার যোগ করুন", "Add a doctor")}</button>
      </div>
      {form && (
        <form onSubmit={save} className="mt-4 rounded-[10px] border border-border bg-card p-4">
          <h2 className="font-semibold">{form.id ? t("ডাক্তারের তথ্য বদলান", "Edit doctor") : t("নতুন ডাক্তার", "New doctor")}</h2>
          <div className="mt-3 flex items-center gap-3">
            {(form.photo_url || doctorPhotos[form.slug]) ? <img src={form.photo_url || doctorPhotos[form.slug]} alt="" className="h-16 w-16 rounded-md border border-border object-cover" /> : <div className="h-16 w-16 rounded-md border border-dashed border-border" />}
            <label className={`${btn} cursor-pointer`}>{t("ছবি বেছে নিন", "Choose photo")}<input type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} /></label>
            {form.photo_url && <button type="button" onClick={() => setForm({ ...form, photo_url: "" })} className={btn}>{t("ছবি সরান", "Remove photo")}</button>}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {fld("name_bn", t("নাম (বাংলা)", "Name (Bangla)"))}
            {fld("name_en", t("নাম (ইংরেজি)", "Name (English)"))}
            {fld("bmdc_no", "BMDC")}
            <div className="md:col-span-2">{fld("degrees", t("ডিগ্রি", "Degrees"))}</div>
            <label className="block">{t("বিশেষত্ব", "Specialty")}<select className={inp} value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}>{Object.entries(specialties).map(([k, [bn, en]]) => <option key={k} value={k}>{t(bn, en)}</option>)}</select></label>
            {fld("designation", t("পদবি", "Designation"))}
            {fld("workplace", t("কর্মস্থল", "Workplace"))}
            {fld("experience_years", t("অভিজ্ঞতা (বছর)", "Experience (years)"), "number")}
            {fld("fee_bdt", t("ফি (৳)", "Fee (৳)"), "number")}
            <label className="block">{t("লিঙ্গ", "Gender")}<select className={inp} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option value="female">{t("নারী", "Female")}</option><option value="male">{t("পুরুষ", "Male")}</option></select></label>
            {fld("slug", t("পাতার ঠিকানা (খালি রাখলে নিজে বানাবে)", "Page address (auto if empty)"))}
          </div>
          {err && <p className="mt-3 text-destructive">{err}</p>}
          <div className="mt-4 flex gap-2">
            <button className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">{t("সংরক্ষণ করুন", "Save")}</button>
            <button type="button" onClick={() => setForm(null)} className={btn}>{t("বাতিল", "Cancel")}</button>
          </div>
        </form>
      )}
      <div className="mt-3">{isLoading ? <p className="text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p> : <SortableTable rows={data} cols={cols} rowKey={(d) => d.id} empty={t("কোনো ডাক্তার নেই।", "No doctors.")} />}</div>
    </div>
  );
}
