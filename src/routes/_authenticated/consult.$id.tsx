import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/appointments";
import { useCms } from "@/lib/cms";
import { INTEGRATIONS_KEY, joinUrl, withDefaults } from "@/lib/integrations";
import { OldPrescriptions } from "@/components/consult/old-prescriptions";
import { MedicineSchedules } from "@/components/consult/medicine-schedules";
import { Chat } from "@/components/consult/chat";
import { CallButtons } from "@/components/consult/call-buttons";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka, formatNumber } from "@/lib/locale";
import { UNIT, formatGlucose, glucoseState } from "@/lib/glucose";
import { ageFromBirthYear, diabetesTypes, type DiabetesType } from "@/lib/profile";
import { useAppointment, usePrescription } from "@/lib/consult";
import { medicineTimingText } from "@/lib/medicine";

export const Route = createFileRoute("/_authenticated/consult/$id")({
  head: () => pageHead("Consultation room", "Private chat and consultation with your DiabeCare doctor."),
  component: Page,
});

const stateClass = { low: "text-glucose-low", ok: "text-glucose-ok", high: "text-glucose-high" };

function Page() {
  const cms = useCms();
  const { id } = Route.useParams();
  const { lang, setLang, t } = useLang();
  const { data: appt, isLoading } = useAppointment(id);

  if (isLoading) return <p className="p-10 text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p>;
  if (!appt) return <p className="p-10">{t("এই অ্যাপয়েন্টমেন্টটা খুঁজে পাওয়া গেল না।", "We couldn't find this appointment.")}</p>;
  const d = appt.doctors;

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
        <div>
          <Link to={appt.isDoctor ? "/doctor" : "/patient"} className="text-sm text-primary underline underline-offset-4">{t("← ফিরে যান", "← Back")}</Link>
          <h1 className="font-display text-xl font-semibold">
            {appt.isDoctor ? (appt.patient?.full_name ?? t("রোগী", "Patient")) : t(d?.name_bn ?? "", d?.name_en ?? "")}
          </h1>
          <p className="text-sm text-muted-foreground">{formatDhaka(new Date(appt.slot_start), lang, { dateStyle: "full", timeStyle: "short" })}</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <CallButtons appointmentId={id} />
          <Link to="/prescription/$id" params={{ id }} className="text-primary underline underline-offset-4">{t("প্রেসক্রিপশন দেখুন", "View prescription")}</Link>
          <button onClick={() => setLang(lang === "bn" ? "en" : "bn")} className="text-primary underline underline-offset-4">{lang === "bn" ? "English" : "বাংলা"}</button>
        </div>
      </header>
      <div className="grid min-h-0 flex-1 md:grid-cols-[1fr_24rem]">
        <div className="flex min-h-0 flex-col">
          <p className="border-b border-border bg-secondary px-6 py-2 text-sm text-muted-foreground">
            {t("ভিডিও কল নতুন ট্যাবে খুলবে। ডাক্তার আর রোগী দুজনেই একই বোতাম চাপলে একই কলে যুক্ত হবেন। ক্যামেরা আর মাইকের অনুমতি দিন।", "The video call opens in a new tab. Doctor and patient join the same call with the same button. Allow camera and microphone.")}
          </p>
          <Chat appointmentId={id} me={appt.me} />
        </div>
        <aside className="overflow-y-auto border-t border-border bg-card p-6 md:border-t-0 md:border-l">
          <Summary patientId={appt.patient_id} appointmentId={id} phone={appt.patient?.phone ?? null} dtype={appt.patient?.diabetes_type ?? null} birthYear={appt.patient?.birth_year ?? null} />
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t("রোগীর পুরনো প্রেসক্রিপশন", "Patient's old prescriptions")}</h3>
            <OldPrescriptions patientId={appt.patient_id} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">{t("রোগীর টেস্ট রিপোর্ট", "Patient's test reports")}</h3>
            <OldPrescriptions patientId={appt.patient_id} kind="test_report" />
          </div>
          {appt.isDoctor && <Link to="/diet-plan/$id" params={{ id }} className="block rounded-md border border-primary px-4 py-2.5 text-center font-medium text-primary transition-colors duration-150 hover:bg-primary hover:text-primary-foreground">{t("খাদ্য তালিকা লিখুন", "Write diet plan")}</Link>}
          {appt.isDoctor && <CompleteButton id={id} status={appt.status} />}
          {appt.isDoctor && <Link to="/rx-write/$id" params={{ id }} className="mt-4 block rounded-md bg-primary px-4 py-2.5 text-center font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">{t("প্রেসক্রিপশন লিখুন", "Write prescription")}</Link>}
          <MedicineSchedules patientId={appt.patient_id} doctorId={appt.isDoctor ? d?.id : undefined} />
        </aside>
      </div>
    </div>
  );
}

function CompleteButton({ id, status }: { id: string; status: string }) {
  const { t } = useLang();
  const qc = useQueryClient();
  if (status === "completed") return <p className="mt-4 text-sm text-glucose-ok">{t("এই পরামর্শ শেষ হয়েছে।", "This consultation is complete.")}</p>;
  return (
    <Button disabled={status !== "confirmed"} onClick={async () => {
      const { error } = await supabase.rpc("change_appointment", { _id: id, _status: "completed" });
      if (error) return alert(error.message);
      qc.invalidateQueries({ queryKey: ["appointment", id] });
    }} className="mt-4 w-full rounded-md border border-primary px-4 py-2 text-primary transition-colors duration-150 hover:bg-secondary">
      {t("পরামর্শ শেষ হয়েছে", "Mark consultation complete")}
    </Button>
  );
}

function Summary({ patientId, appointmentId, phone, dtype, birthYear }: { patientId: string; appointmentId: string; phone: string | null; dtype: DiabetesType | null; birthYear: number | null }) {
  const age = ageFromBirthYear(birthYear);
  const { lang, t } = useLang();
  const { data: readings = [] } = useQuery({
    queryKey: ["patient-readings", patientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("glucose_readings").select("id, value_mmol, reading_type, taken_at, note").eq("user_id", patientId).order("taken_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data.map((r) => ({ ...r, value_mmol: r.value_mmol ?? 0 }));
    },
  });
  const { data: rx } = usePrescription(appointmentId);
  return (
    <div>
      <h2 className="font-display text-lg font-semibold">{t("রোগীর সারাংশ", "Patient summary")}</h2>
      <p className="text-sm text-muted-foreground">
        {dtype ? t(...diabetesTypes[dtype]) : t("ধরন জানানো হয়নি", "Type not given")}
        {age ? <> · {formatNumber(age, lang)} {t("বছর", "yrs")}</> : null}
        {phone && <> · {phone}</>}
      </p>
      <h3 className="mt-5 text-sm font-medium text-muted-foreground">{t(`সাম্প্রতিক সুগার (${UNIT})`, `Recent sugar (${UNIT})`)}</h3>
      {readings.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">{t("এখনো কোনো রিডিং লেখা হয়নি।", "No readings logged yet.")}</p> : (
        <table className="mt-2 w-full text-sm">
          <tbody>
            {readings.map((r) => (
              <tr key={r.id} className="border-b border-border">
                <td className="py-1.5">{formatDhaka(new Date(r.taken_at), lang, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</td>
                <td className="py-1.5 pl-2 text-xs text-muted-foreground">{r.note}</td>
                <td className={`py-1.5 text-right font-medium ${stateClass[glucoseState(r.value_mmol)]}`}>{formatGlucose(r.value_mmol, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h3 className="mt-6 text-sm font-medium text-muted-foreground">{t("ওষুধ", "Medicines")}</h3>
      {!rx || rx.items.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">{t("এখনো কোনো ওষুধ লেখা হয়নি।", "No medicines written yet.")}</p> : (
        <ul className="mt-2 divide-y divide-border text-sm">
          {rx.items.map((m, i) => <li key={i} className="py-1.5 break-words"><span className="font-medium">{m.name}</span> — {m.dose} · {medicineTimingText(m, t)}{m.comment && <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{t("মন্তব্য", "Comment")}: {m.comment}</p>}</li>)}
        </ul>
      )}
    </div>
  );
}
