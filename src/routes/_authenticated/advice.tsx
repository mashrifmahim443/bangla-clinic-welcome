import { pageHead } from "@/lib/appointments";
import { createFileRoute } from "@tanstack/react-router";
import { DoctorAdvice } from "@/components/consult/doctor-advice";
import { MedicineSchedules } from "@/components/consult/medicine-schedules";
import { RoleShell } from "@/components/site/role-shell";

export const Route = createFileRoute("/_authenticated/advice")({
  head: () => pageHead('Doctor advice', 'Read your private Diacare prescriptions and doctor advice.'),
  component: () => (
    <RoleShell role="patient">
      <DoctorAdvice />
      <MedicineSchedules />
    </RoleShell>
  ),
});
