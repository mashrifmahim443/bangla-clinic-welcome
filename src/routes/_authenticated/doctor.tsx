import { createFileRoute } from "@tanstack/react-router";
import { AppointmentList } from "@/components/consult/appointment-list";
import { RoleShell } from "@/components/site/role-shell";
import { useLang } from "@/lib/i18n";
import { pageHead } from "@/lib/appointments";
import { formatDhaka } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/doctor")({
  head: () => pageHead("Doctor appointments", "Accept, reschedule and manage your patient consultations."),
  component: Page,
});

function Page() {
  const { lang, t } = useLang();
  return (
    <RoleShell role="doctor">
      <h1 className="font-display text-3xl font-semibold">{t("আজকের রোগী", "Today's patients")}</h1>
      <p className="mt-2 text-muted-foreground">{formatDhaka(new Date(), lang, { dateStyle: "full", timeStyle: "short" })}</p>
      <AppointmentList as="doctor" />
    </RoleShell>
  );
}
