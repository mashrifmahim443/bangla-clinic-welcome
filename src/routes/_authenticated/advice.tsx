import { createFileRoute } from "@tanstack/react-router";
import { DoctorAdvice } from "@/components/consult/doctor-advice";
import { RoleShell } from "@/components/site/role-shell";

export const Route = createFileRoute("/_authenticated/advice")({
  head: () => ({ meta: [{ title: "Doctor's advice — DiabeCare" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <RoleShell role="patient">
      <DoctorAdvice />
    </RoleShell>
  ),
});
