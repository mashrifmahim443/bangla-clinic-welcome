import { createFileRoute, Link, Navigate, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { homeForRoles, useMyRoles } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — DiabeCare" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const groups = [
  { bn: "পরিচালনা", en: "Manage", links: [
    { to: "/admin", bn: "সারসংক্ষেপ", en: "Overview" },
    { to: "/admin/users", bn: "ব্যবহারকারী", en: "Users" },
    { to: "/admin/appointments", bn: "অ্যাপয়েন্টমেন্ট", en: "Appointments" },
  ] },
  { bn: "ডাক্তার", en: "Doctors", links: [
    { to: "/admin/doctors", bn: "ডাক্তারের তালিকা", en: "Doctor list" },
    { to: "/admin/applications", bn: "ডাক্তারের আবেদন", en: "Doctor applications" },
  ] },
  { bn: "সাইটের বিষয়বস্তু", en: "Site content", links: [
    { to: "/admin/content", bn: "সাইটের লেখা ও ছবি", en: "Site text & images" },
    { to: "/admin/articles", bn: "লেখা", en: "Articles" },
    { to: "/admin/diet", bn: "খাদ্য তালিকা", en: "Diet chart" },
    { to: "/admin/exercise", bn: "ব্যায়াম", en: "Exercises" },
  ] },
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
    <div className="min-h-screen text-sm md:grid md:grid-cols-[14rem_1fr]">
      <aside className="flex flex-col border-b border-border bg-card md:sticky md:top-0 md:h-screen md:border-r md:border-b-0">
        <div className="border-b border-border px-4 py-4">
          <Link to="/" className="font-display text-lg font-semibold text-primary">DiabeCare</Link>
          <p className="mt-0.5 text-xs font-medium tracking-wide text-accent uppercase">{t("অ্যাডমিন প্যানেল", "Admin panel")}</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {groups.map((g) => (
            <div key={g.en} className="mb-4">
              <p className="px-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{t(g.bn, g.en)}</p>
              {g.links.map((l) => (
                <Link key={l.to} to={l.to} activeOptions={{ exact: l.to === "/admin" }}
                  className="block rounded-md border-l-2 border-transparent px-2 py-1.5 text-foreground transition-colors duration-150 hover:bg-secondary hover:text-primary"
                  activeProps={{ className: "border-primary bg-secondary font-semibold text-primary" }}>
                  {t(l.bn, l.en)}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-border p-3 text-xs">
          <p className="truncate text-muted-foreground" title={data?.email ?? ""}>{data?.email}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => setLang(lang === "bn" ? "en" : "bn")} className="rounded-md border border-border bg-background px-2 py-1.5 font-medium text-primary transition-colors duration-150 hover:border-primary hover:bg-secondary">{lang === "bn" ? "English" : "বাংলা"}</button>
            <button onClick={async () => { await qc.cancelQueries(); qc.clear(); await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }} className="rounded-md border border-accent/40 px-2 py-1.5 font-medium text-accent transition-colors duration-150 hover:bg-accent hover:text-accent-foreground">{t("বের হন", "Sign out")}</button>
          </div>
        </div>
      </aside>
      <main className="min-w-0 p-4 md:p-6"><Outlet /></main>
    </div>
  );
}
