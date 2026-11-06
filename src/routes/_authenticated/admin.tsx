import { createFileRoute, Link, Navigate, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { homeForRoles, useMyRoles } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — DiabeCare" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const links = [
  { to: "/admin", bn: "সারসংক্ষেপ", en: "Overview" },
  { to: "/admin/users", bn: "ব্যবহারকারী", en: "Users" },
  { to: "/admin/appointments", bn: "অ্যাপয়েন্টমেন্ট", en: "Appointments" },
  { to: "/admin/doctors", bn: "ডাক্তার", en: "Doctors" },
  { to: "/admin/applications", bn: "ডাক্তারের আবেদন", en: "Doctor applications" },
  { to: "/admin/content", bn: "সাইটের লেখা ও ছবি", en: "Site text & images" },
  { to: "/admin/articles", bn: "লেখা", en: "Articles" },
  { to: "/admin/diet", bn: "খাদ্য তালিকা", en: "Diet chart" },
  { to: "/admin/exercise", bn: "ব্যায়াম", en: "Exercises" },
] as const;

function AdminLayout() {
  const { data, isLoading } = useMyRoles();
  const { lang, setLang, t } = useLang();
  const qc = useQueryClient();
  const navigate = useNavigate();
  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p>;
  const roles = data?.roles ?? [];
  if (!roles.includes("admin")) return <Navigate to={homeForRoles(roles)} replace />;
  return (
    <div className="min-h-screen text-sm md:grid md:grid-cols-[12rem_1fr]">
      <aside className="border-b border-border bg-card px-4 py-4 md:border-r md:border-b-0">
        <Link to="/" className="font-display text-base font-semibold text-primary">DiabeCare</Link>
        <p className="text-xs text-muted-foreground">{t("অ্যাডমিন", "Admin")}</p>
        <nav className="mt-5 flex flex-wrap gap-x-4 md:block md:space-y-0.5">
          {links.map((l) => (
            <Link key={l.to} to={l.to} activeOptions={{ exact: l.to === "/admin" }} className="block py-1 text-foreground hover:text-primary" activeProps={{ className: "font-semibold text-primary underline underline-offset-4" }}>
              {t(l.bn, l.en)}
            </Link>
          ))}
        </nav>
        <div className="mt-6 space-y-1 border-t border-border pt-3 text-xs">
          <p className="truncate text-muted-foreground">{data?.email}</p>
          <button onClick={() => setLang(lang === "bn" ? "en" : "bn")} className="block text-primary underline">{lang === "bn" ? "English" : "বাংলা"}</button>
          <button onClick={async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }} className="block text-primary underline">{t("বের হন", "Sign out")}</button>
        </div>
      </aside>
      <main className="min-w-0 p-4 md:p-6"><Outlet /></main>
    </div>
  );
}
