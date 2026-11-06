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
        </nav>
        <div className="mt-8 space-y-2 text-sm">
          <p className="truncate text-muted-foreground">{data?.email}</p>
          <button onClick={() => setLang(lang === "bn" ? "en" : "bn")} className="block text-primary underline underline-offset-4">
            {lang === "bn" ? "English" : "বাংলা"}
          </button>
          <button onClick={signOut} className="block text-primary underline underline-offset-4">{t("বের হন", "Sign out")}</button>
        </div>
      </aside>
      <main className="p-6 md:p-10">{children}</main>
    </div>
  );
}
