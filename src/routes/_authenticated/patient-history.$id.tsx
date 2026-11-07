import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RoleShell } from "@/components/site/role-shell";
import { OldPrescriptions } from "@/components/consult/old-prescriptions";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka } from "@/lib/locale";
import { averageGlucose, formatGlucose, readingLabel } from "@/lib/glucose";
import { pageHead } from "@/lib/appointments";
export const Route = createFileRoute("/_authenticated/patient-history/$id")({ head: () => pageHead("Patient medical history", "Private patient details, glucose readings, prescriptions and reports for their doctor."), component: Page });
function Page() {
  const { id } = Route.useParams(); const { lang, t } = useLang();
  const { data, error } = useQuery({ queryKey: ["medical-history", id], queryFn: async () => {
    const { data: user } = await supabase.auth.getUser(); if (!user.user) throw new Error("Sign in required");
    const { data: doctor } = await supabase.from("doctors").select("id").eq("user_id", user.user.id).maybeSingle(); if (!doctor) throw new Error("Doctor only");
    const { data: a, error } = await supabase.from("appointments").select("patient_id").eq("id", id).eq("doctor_id", doctor.id).maybeSingle(); if (error) throw error; if (!a) throw new Error("Appointment not found");
    const [p,r,rx] = await Promise.all([supabase.from("profiles").select("*").eq("id",a.patient_id).maybeSingle(),supabase.from("glucose_readings").select("id,value_mmol,taken_at,note,reading_type,meal_slot").eq("user_id",a.patient_id).order("taken_at",{ascending:false}).limit(100),supabase.from("prescriptions").select("id,appointment_id,advice,created_at").eq("patient_id",a.patient_id).order("created_at",{ascending:false})]);
    if(p.error) throw p.error; if(r.error) throw r.error; if(rx.error) throw rx.error;
    return { patientId:a.patient_id,profile:p.data,readings:r.data,prescriptions:rx.data };
  } });
  return <RoleShell role="doctor"><Link to="/doctor" className="text-primary underline">{t("অ্যাপয়েন্টমেন্টে ফিরুন", "Back to appointments")}</Link><h1 className="mt-4 font-display text-3xl font-semibold">{t("রোগীর ইতিহাস", "Patient history")}</h1>{error && <p role="alert" className="text-destructive">{error.message}</p>}{data && <>
    <h2 className="mt-5 text-xl font-semibold">{data.profile?.full_name}</h2><dl className="mt-3 grid gap-x-5 border-t border-border sm:grid-cols-2">{[
      [t("ফোন", "Phone"),data.profile?.phone],[t("ঠিকানা", "Address"),data.profile?.address],[t("ডায়াবেটিসের ধরন", "Diabetes type"),data.profile?.diabetes_type],[t("জন্মসাল", "Birth year"),data.profile?.birth_year],[t("ডায়াবেটিস ধরা পড়ার সাল", "Diagnosed year"),data.profile?.diagnosed_year],[t("এখনকার ওষুধ", "Current medicines"),data.profile?.medicines],[t("অন্যান্য রোগ বা অ্যালার্জি", "Other conditions or allergies"),data.profile?.other_conditions],[t("জরুরি যোগাযোগ", "Emergency contact"),data.profile?.emergency_contact],[t("ওজন (kg)", "Weight (kg)"),data.profile?.weight_kg]
    ].map(([label,value]) => <div key={String(label)} className="border-b border-border py-3"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap">{value ?? "—"}</dd></div>)}</dl>
    <h2 className="mt-7 font-display text-xl font-semibold">{t("সুগারের ইতিহাস", "Glucose history")}</h2><div className="overflow-x-auto"><table className="mt-3 w-full text-left text-sm"><thead><tr className="border-b border-border"><th>{t("সময়", "Time")}</th><th>mmol/L</th><th>{t("নোট", "Note")}</th></tr></thead><tbody>{data.readings.map(r => <tr key={r.id} className="border-b border-border"><td className="py-2">{formatDhaka(new Date(r.taken_at),lang)}</td><td>{r.value_mmol === null ? "—" : formatGlucose(r.value_mmol,lang)}</td><td>{r.note}</td></tr>)}</tbody></table></div>
    <h2 className="mt-7 font-display text-xl font-semibold">{t("আগের পরামর্শ", "Previous advice")}</h2>{data.prescriptions.map(rx => <div key={rx.id} className="border-b border-border py-3"><p>{formatDhaka(new Date(rx.created_at),lang)}</p><p>{rx.advice}</p><Link to="/prescription/$id" params={{id:rx.appointment_id}} className="text-primary underline">{t("প্রেসক্রিপশন দেখুন", "View prescription")}</Link></div>)}
    <section className="mt-7"><h2 className="mb-3 font-display text-xl font-semibold">{t("পুরনো প্রেসক্রিপশন", "Old prescriptions")}</h2><OldPrescriptions patientId={data.patientId} /></section><section className="mt-7"><h2 className="mb-3 font-display text-xl font-semibold">{t("টেস্ট রিপোর্ট", "Test reports")}</h2><OldPrescriptions patientId={data.patientId} kind="test_report" /></section>
  </>}</RoleShell>;
}
