import { createFileRoute } from "@tanstack/react-router";
import { OldPrescriptions } from "@/components/consult/old-prescriptions";
import { RoleShell } from "@/components/site/role-shell";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/old-prescriptions")({
  head: () => ({ meta: [{ title: "Old prescriptions — DiabeCare" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { t } = useLang();
  return (
    <RoleShell role="patient">
      <h1 className="mb-5 font-display text-3xl font-semibold">{t("পুরনো প্রেসক্রিপশন", "Old prescriptions")}</h1>
      <div className="max-w-3xl"><OldPrescriptions /></div>
    </RoleShell>
  );
}
