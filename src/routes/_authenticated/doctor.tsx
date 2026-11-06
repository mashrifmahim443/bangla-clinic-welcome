import { createFileRoute } from "@tanstack/react-router";
import { RoleShell } from "@/components/site/role-shell";
import { useLang } from "@/lib/i18n";
import { formatDhaka } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/doctor")({
  head: () => ({ meta: [{ title: "Doctor — DiabeCare" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { lang, t } = useLang();
  return (
    <RoleShell role="doctor">
      <h1 className="font-display text-3xl font-semibold">{t("আজকের রোগী", "Today's patients")}</h1>
      <p className="mt-2 text-muted-foreground">{formatDhaka(new Date(), lang, { dateStyle: "full", timeStyle: "short" })}</p>
    </RoleShell>
  );
}
