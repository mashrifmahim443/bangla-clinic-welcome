import { TextSizeToggle } from "@/components/site/text-size-toggle";
import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { homeForRoles, useMyRoles, type AppRole } from "@/lib/roles";

const navByRole: Record<AppRole, { to: "/admin" | "/doctor" | "/patient"; bn: string; en: string }> = {
  admin: { to: "/admin", bn: "অ্যাডমিন", en: "Admin" },
  doctor: { to: "/doctor", bn: "ডাক্তার", en: "Doctor" },
  patient: { to: "/patient", bn: "রোগী", en: "Patient" },
};

export function RoleShell({ role, children }: { role: AppRole; children: ReactNode }) {
  const { data, isLoading } = useMyRoles();
  const { lang, setLang, t } = useLang();
  const qc = useQueryClient();
  const navigate = useNavigate();

  if (isLoading) return <p className="p-10 text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p>;
  const roles = data?.roles ?? [];
  if (!roles.includes(role)) return <Navigate to={homeForRoles(roles)} replace />;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-[15rem_1fr]">
      <aside className="border-b border-border bg-card p-6 md:border-r md:border-b-0">
        <Link to="/" className="font-display text-lg font-semibold text-primary">ডায়াবিকেয়ার / DiabeCare</Link>
        <nav className="mt-8 space-y-1">
          {roles.map((r) => (
            <Link key={r} to={navByRole[r].to} className="block rounded-md px-3 py-2 hover:bg-secondary" activeProps={{ className: "bg-secondary text-primary font-medium" }}>
              {t(navByRole[r].bn, navByRole[r].en)}
            </Link>
          ))}
          {roles.includes("patient") && (
            <Link to="/advice" className="block rounded-md px-3 py-2 hover:bg-secondary" activeProps={{ className: "bg-secondary text-primary font-medium" }}>
              {t("ডাক্তারের পরামর্শ", "Doctor's advice")}
            </Link>
          )}
          {roles.includes("patient") && (
            <Link to="/old-prescriptions" className="block rounded-md px-3 py-2 hover:bg-secondary" activeProps={{ className: "bg-secondary text-primary font-medium" }}>
              {t("প্রেসক্রিপশন ও রিপোর্ট", "Prescriptions & reports")}
            </Link>
          )}
        </nav>
        <div className="mt-8 rounded-[10px] border border-border bg-card text-sm">
          <p className="truncate border-b border-border px-3 py-2 text-muted-foreground">{data?.email}</p>
          <div className="grid grid-cols-2 gap-2 border-b border-border p-3">
            <button onClick={() => setLang(lang === "bn" ? "en" : "bn")} className={chip}>
              {lang === "bn" ? "English" : "বাংলা"}
            </button>
            <TextSizeToggle className={chip} />
          </div>
          <div className="p-1">
            <Link to="/profile" className={row} activeProps={{ className: "bg-secondary text-primary font-medium" }}>{t("আমার তথ্য", "My details")}<span aria-hidden className="text-muted-foreground">→</span></Link>
            {!roles.includes("doctor") && <Link to="/doctor-apply" className={row} activeProps={{ className: "bg-secondary text-primary font-medium" }}>{t("ডাক্তার হিসেবে যোগ দিন", "Join as a doctor")}<span aria-hidden className="text-muted-foreground">→</span></Link>}
          </div>
          <div className="border-t border-border p-3">
            <button onClick={signOut} className="w-full rounded-md border border-accent/40 px-3 py-2 font-medium text-accent transition-colors duration-150 hover:bg-accent hover:text-accent-foreground">{t("বের হন", "Sign out")}</button>
          </div>
        </div>
      </aside>
      <main className="p-6 md:p-10">{children}</main>
    </div>
  );
}

const chip = "rounded-md border border-border bg-background px-2 py-2 text-center font-medium text-primary transition-colors duration-150 hover:border-primary hover:bg-secondary aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground";
const row = "flex items-center justify-between rounded-md px-3 py-2 text-foreground transition-colors duration-150 hover:bg-secondary hover:text-primary";
