import { createFileRoute, Link } from "@tanstack/react-router";
import { RoleShell } from "@/components/site/role-shell";
import { RxEditor } from "@/components/consult/rx-editor";
import { useAppointment } from "@/lib/consult";
import { useLang } from "@/lib/i18n";
import { formatDhaka, formatNumber } from "@/lib/locale";
import { pageHead } from "@/lib/appointments";
import { ageFromBirthYear } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/rx-write/$id")({
  head: () => pageHead("Write prescription", "Write and save a patient prescription in Diacare."),
  component: Page,
});

function Page() {
  const { id } = Route.useParams();
  const { lang, t } = useLang();
  const { data: appt, isLoading } = useAppointment(id);
  return <RoleShell role="doctor">
    {isLoading ? <p className="text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p>
      : !appt || !appt.isDoctor || !appt.doctors ? <p>{t("এই অ্যাপয়েন্টমেন্টটা খুঁজে পাওয়া গেল না।", "We couldn't find this appointment.")}</p>
      : <>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
          <div>
            <Link to="/consult/$id" params={{ id }} className="text-sm text-primary underline underline-offset-4">{t("← পরামর্শ কক্ষে ফিরুন", "← Back to room")}</Link>
            <h1 className="mt-1 font-display text-3xl font-semibold">{t("প্রেসক্রিপশন লিখুন", "Write prescription")}</h1>
            <p className="text-muted-foreground">{appt.patient?.full_name ?? t("রোগী", "Patient")}
              {ageFromBirthYear(appt.patient?.birth_year ?? null) ? ` · ${formatNumber(ageFromBirthYear(appt.patient?.birth_year ?? null)!, lang)} ${t("বছর", "yrs")}` : ""}
              {" · "}{formatDhaka(new Date(appt.slot_start), lang)}</p>
            {appt.reason && <p className="mt-1 text-sm">{t("সমস্যা", "Problem")}: {appt.reason}</p>}
          </div>
          <Link to="/patient-history/$id" params={{ id }} className="text-sm text-primary underline underline-offset-4">{t("রোগীর ইতিহাস দেখুন", "See patient history")}</Link>
        </div>
        <div className="mt-6"><RxEditor appointmentId={id} patientId={appt.patient_id} doctorId={appt.doctors.id} doctor={appt.doctors} patientName={appt.patient?.full_name ?? ""} /></div>
      </>}
  </RoleShell>;
}
