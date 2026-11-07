import { MIN_COMPLETION, profileCompletion } from "@/lib/profile";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { Button } from "@/components/ui/button";
import { DoctorReviews } from "@/components/consult/doctor-reviews";
import { DoctorBadges } from "@/components/consult/doctor-badges";
import { useLang } from "@/lib/i18n";
import { dhakaNowParts, formatBDT, formatDhaka, formatNumber } from "@/lib/locale";
import { StatusDot, doctorPhotos, specialties, statusInfo } from "@/lib/doctors";
import { consultationLabels, fieldClass, flatButton, useAppointmentRealtime, useDoctorRealtime } from "@/lib/appointments";

export const Route = createFileRoute("/doctors/$slug")({
  head: () => ({ meta: [{ title: "Doctor profile and booking — DiabeCare" }, { name: "description", content: "Doctor qualifications, patient reviews and available consultation times in Bangladesh." }, { property: "og:title", content: "Doctor profile and booking — DiabeCare" }, { property: "og:description", content: "Choose a doctor and request a video, audio or chat consultation." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: BookingPage,
});
function BookingPage() {
  const { slug } = Route.useParams(); const { lang, t } = useLang(); const qc = useQueryClient();
  useAppointmentRealtime(); useDoctorRealtime();
  const [date, setDate] = useState(dhakaNowParts().date); const [picked, setPicked] = useState(""); const [type, setType] = useState("video"); const [reason, setReason] = useState(""); const [reports, setReports] = useState<string[]>([]); const [file, setFile] = useState<File | null>(null); const [msg, setMsg] = useState("");
  const { data: doctor, isLoading } = useQuery({ queryKey: ["doctor", slug], queryFn: async () => { const { data, error } = await supabase.from("doctors").select("*").eq("slug", slug).eq("active", true).maybeSingle(); if (error) throw error; return data; } });
  const { data: user } = useQuery({ queryKey: ["session-user"], queryFn: async () => (await supabase.auth.getUser()).data.user });
  const { data: completion } = useQuery({ queryKey: ["my-profile-completion", user?.id], enabled: !!user, queryFn: async () => { if (!user) return 0; const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(); if (error) throw error; return profileCompletion(data); } });
  const { data: slots = [], error: slotError } = useQuery({ queryKey: ["available-slots", doctor?.id, date], enabled: !!doctor && !!date, queryFn: async () => { if (!doctor) return []; const { data, error } = await supabase.rpc("available_doctor_slots", { _doctor: doctor.id, _from: date, _to: date }); if (error) throw error; return data; } });
  const { data: oldReports = [] } = useQuery({ queryKey: ["booking-reports", user?.id], enabled: !!user, queryFn: async () => { if (!user) return []; const { data, error } = await supabase.from("old_prescriptions").select("id,file_name,doctor_name").eq("user_id", user.id); if (error) throw error; return data; } });
  const upload = useMutation({ mutationFn: async () => {
    if (!user || !file) throw new Error(t("আগে ফাইল বেছে নিন।", "Choose a file first."));
    if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error(t("১০ MB পর্যন্ত JPG, PNG বা PDF দিন।", "Use JPG, PNG or PDF up to 10 MB."));
    const path = `${user.id}/${crypto.randomUUID()}.${file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg"}`;
    const up = await supabase.storage.from("old-prescriptions").upload(path, file); if (up.error) throw up.error;
    const { data, error } = await supabase.from("old_prescriptions").insert({ kind: "test_report", file_path: path, file_name: file.name }).select("id").single();
    if (error) { await supabase.storage.from("old-prescriptions").remove([path]); throw error; } return data.id;
  }, onSuccess: id => { setReports(r => [...r, id]); setFile(null); setMsg(t("রিপোর্ট যোগ হয়েছে।", "Report attached.")); void qc.invalidateQueries({ queryKey: ["booking-reports"] }); }, onError: e => setMsg(e.message) });
  const book = useMutation({ mutationFn: async () => { if (!doctor || !picked || !user) throw new Error(t("একটি খালি সময় বেছে নিন।", "Choose an available time.")); const { error } = await supabase.rpc("book_appointment", { _doctor: doctor.id, _slot: picked, _type: type, _reason: reason, _reports: reports }); if (error) throw error; }, onSuccess: () => { setPicked(""); setMsg(t("অনুরোধ পাঠানো হয়েছে। ডাক্তার গ্রহণ করলে নোটিফিকেশন পাবেন।", "Request sent. You will be notified when the doctor accepts.")); void qc.invalidateQueries({ queryKey: ["available-slots"] }); void qc.invalidateQueries({ queryKey: ["appointments"] }); }, onError: e => setMsg(e.message) });
  return <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-4xl px-5 py-10">
    <Link to="/doctors" className="text-primary underline">{t("সব ডাক্তার", "All doctors")}</Link>
    {isLoading ? <p>{t("লোড হচ্ছে…", "Loading…")}</p> : !doctor ? <p>{t("ডাক্তারকে পাওয়া গেল না।", "Doctor not found.")}</p> : <>
      <div className="mt-5 flex flex-wrap gap-5 border-b border-border pb-6">{(doctor.photo_url || doctorPhotos[doctor.slug]) ? <img src={doctor.photo_url || doctorPhotos[doctor.slug]} alt={t(doctor.name_bn, doctor.name_en)} className="h-24 w-24 rounded-md border border-border object-cover" /> : <span className="flex h-24 w-24 items-center justify-center rounded-md border border-border bg-secondary font-display text-3xl" aria-hidden="true">{t(doctor.name_bn, doctor.name_en).slice(0, 1)}</span>}<div className="min-w-0 flex-1"><h1 className="font-display text-3xl font-semibold">{t(doctor.name_bn, doctor.name_en)}</h1><p>{doctor.degrees}</p><p className="text-muted-foreground">{doctor.designation} {doctor.workplace}</p><p className="text-sm">{t(...(specialties[doctor.specialty] ?? [doctor.specialty, doctor.specialty]))} · BMDC {doctor.bmdc_no}</p><p>{formatNumber(doctor.experience_years ?? 0, lang)} {t("বছরের অভিজ্ঞতা", "years of experience")} · {formatBDT(doctor.fee_bdt, lang)}</p></div><StatusDot status={doctor.status} label={t(statusInfo[doctor.status].bn, statusInfo[doctor.status].en)} /></div>
      <DoctorBadges {...doctor} />
      {(doctor.bio_bn || doctor.bio_en) && <section className="mt-5"><h2 className="font-display text-xl font-semibold">{t("পরিচিতি", "About the doctor")}</h2><p className="whitespace-pre-wrap">{t(doctor.bio_bn ?? "", doctor.bio_en ?? "")}</p></section>}
      <section className="mt-7"><h2 className="font-display text-xl font-semibold">{t("সময় বেছে নিন", "Choose a time")}</h2><label className="mt-3 block max-w-xs">{t("তারিখ (ঢাকার সময়)", "Date (Dhaka time)")}<input type="date" className={fieldClass} value={date} min={dhakaNowParts().date} onChange={e => { setDate(e.target.value); setPicked(""); }} /></label>
        {slotError && <p role="alert" className="text-destructive">{slotError.message}</p>}
        {!slots.length && <p className="mt-4 text-muted-foreground">{t("এই দিনে কোনো সময় খালি নেই। অন্য দিন দেখুন।", "No available slots on this date. Try another day.")}</p>}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{slots.map(s => <Button key={s.slot_start} variant={picked === s.slot_start ? "default" : "outline"} className={flatButton} aria-pressed={picked === s.slot_start} onClick={() => setPicked(s.slot_start)}>{formatDhaka(new Date(s.slot_start), lang, { timeStyle: "short" })}</Button>)}</div>
      </section>
      {!user ? <p className="mt-6"><Button asChild size="lg" className="min-h-12 w-full border border-accent bg-accent px-7 text-base font-semibold text-accent-foreground shadow-none transition-colors duration-150 hover:bg-accent/90 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"><Link to="/auth" search={{ next: `/doctors/${slug}` }}>{t("বুক করতে ঢুকুন", "Sign in to book")}</Link></Button></p> : completion === undefined ? <p>{t("প্রোফাইল দেখা হচ্ছে…", "Checking profile…")}</p> : completion < MIN_COMPLETION ? <p className="mt-6">{t(`প্রোফাইল ${formatNumber(completion, "bn")}% পূরণ হয়েছে। অন্তত ৬০% লাগবে।`, `Profile ${completion}% complete. At least 60% is required.`)} <Link to="/profile" className="text-primary underline">{t("প্রোফাইল পূরণ করুন", "Complete profile")}</Link></p> : <form className="mt-7 space-y-4 border-t border-border pt-5" onSubmit={e => { e.preventDefault(); book.mutate(); }}>
        <fieldset><legend className="font-medium">{t("পরামর্শের ধরন", "Consultation type")}</legend><div className="mt-2 flex flex-wrap gap-2">{Object.entries(consultationLabels).map(([key, label]) => <Button type="button" key={key} variant={type === key ? "default" : "outline"} className={flatButton} aria-pressed={type === key} onClick={() => setType(key)}>{t(...label)}</Button>)}</div></fieldset>
        <label className="block">{t("কী সমস্যা নিয়ে দেখাবেন?", "Reason for consultation")}<textarea required minLength={3} maxLength={2000} rows={3} className={fieldClass} value={reason} onChange={e => setReason(e.target.value)} /></label>
        <fieldset><legend className="font-medium">{t("আগের প্রেসক্রিপশন ও রিপোর্ট", "Previous prescriptions and reports")}</legend>{oldReports.map(r => <label key={r.id} className="mt-2 flex items-center gap-2"><input type="checkbox" checked={reports.includes(r.id)} onChange={e => setReports(list => e.target.checked ? [...list, r.id] : list.filter(id => id !== r.id))} />{r.doctor_name || r.file_name}</label>)}<label className="mt-3 block">{t("নতুন রিপোর্ট (JPG, PNG বা PDF; ১০ MB)", "New report (JPG, PNG or PDF; 10 MB)")}<input type="file" accept="image/jpeg,image/png,application/pdf" className={fieldClass} onChange={e => setFile(e.target.files?.[0] ?? null)} /></label><Button type="button" variant="outline" className={`mt-2 ${flatButton}`} disabled={!file || upload.isPending} onClick={() => upload.mutate()}>{t("রিপোর্ট যোগ করুন", "Attach report")}</Button></fieldset>
        <p className="text-sm text-muted-foreground">{t("ফি", "Fee")}: {formatBDT(doctor.fee_bdt, lang)} · {t("অনলাইন পেমেন্ট এখন চালু নেই। এখানে টাকা কাটা হবে না।", "Online payment is not available. No money will be charged here.")}</p>
        <p className="text-sm text-muted-foreground">{t("অন্তত ২৪ ঘণ্টা আগে বাতিল করলে ফেরতের যোগ্য। পরে বাতিল করলে অ্যাডমিন সিদ্ধান্ত নেবেন।", "Cancellation at least 24 hours before qualifies for a refund; later cancellations are reviewed by admin.")}</p>
        <Button disabled={!picked || book.isPending || upload.isPending} className={flatButton}>{t("অ্যাপয়েন্টমেন্টের অনুরোধ পাঠান", "Request appointment")}</Button>
      </form>}
      {msg && <p role="status" className="mt-4 border-l-2 border-primary pl-3">{msg}</p>}
      <DoctorReviews doctorId={doctor.id} />
    </>}
  </main><SiteFooter /></div>;
}
