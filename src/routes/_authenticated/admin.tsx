import { createFileRoute, Link, Navigate, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { homeForRoles, useMyRoles } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — DiabeCare" }, { name: "description", content: "Manage DiabeCare users, doctors and site content." }, { property: "og:title", content: "Admin — DiabeCare" }, { property: "og:description", content: "Manage DiabeCare users, doctors and site content." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
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
  { bn: "সাইটের লেখা ও ছবি", en: "Site content", links: [
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
  const path = useLocation({ select: (l) => l.pathname });
  const isAdmin = (data?.roles ?? []).includes("admin");
  const { data: counts } = useQuery({
    queryKey: ["admin-badges"], enabled: isAdmin, refetchInterval: 60000,
    queryFn: async () => {
      const [u, a] = await Promise.all([
        supabase.rpc("admin_users"),
        supabase.from("doctor_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      const users = (u.data ?? []) as { account_status: string; deletion_requested: boolean }[];
      return {
        "/admin/users": users.filter((x) => x.account_status === "pending" || x.deletion_requested).length,
        "/admin/applications": a.count ?? 0,
      } as Record<string, number>;
    },
  });
  const all = groups.flatMap((g) => g.links.map((l) => ({ ...l, group: g })));
  const current = [...all].sort((a, b) => b.to.length - a.to.length).find((l) => l.to === "/admin" ? path === "/admin" || path === "/admin/" : path.startsWith(l.to));
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
        <nav className="flex flex-1 gap-4 overflow-x-auto px-2 py-3 md:block md:overflow-y-auto">
          {groups.map((g) => (
            <div key={g.en} className="shrink-0 md:mb-4">
              <p className="px-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{t(g.bn, g.en)}</p>
              {g.links.map((l) => (
                <Link key={l.to} to={l.to} activeOptions={{ exact: l.to === "/admin" }}
                  className="block rounded-md border-l-2 border-transparent px-2 py-1.5 text-foreground transition-colors duration-150 hover:bg-secondary hover:text-primary"
                  activeProps={{ className: "border-primary bg-secondary font-semibold text-primary" }}>
                  <span className="flex items-center justify-between gap-2">
                    {t(l.bn, l.en)}
                    {(counts?.[l.to] ?? 0) > 0 && <span className="min-w-5 rounded-sm bg-accent px-1.5 text-center text-[11px] font-semibold text-accent-foreground tabular-nums">{counts![l.to]}</span>}
                  </span>
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
      <div className="min-w-0">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
          <div className="min-w-0">
            {current && <p className="text-[11px] tracking-wide text-muted-foreground uppercase">{t(current.group.bn, current.group.en)}</p>}
            <p className="truncate font-display text-lg font-semibold text-primary">{current ? t(current.bn, current.en) : t("অ্যাডমিন", "Admin")}</p>
          </div>
          <Link to="/" target="_blank" className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-primary transition-colors duration-150 hover:border-primary hover:bg-secondary">{t("সাইট দেখুন ↗", "View site ↗")}</Link>
        </header>
        <main className="p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
