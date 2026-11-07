import { Notifications } from "@/components/consult/notifications";
import { TextSizeToggle } from "@/components/site/text-size-toggle";
import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { homeForRoles, useMyRoles, type AppRole } from "@/lib/roles";

const navByRole: Record<AppRole, { to: "/admin" | "/doctor" | "/patient"; bn: string; en: string }> = {
  admin: { to: "/admin", bn: "অ্যাডমিন", en: "Admin" },
  doctor: { to: "/doctor", bn: "ডাক্তারের হোম", en: "Doctor home" },
  patient: { to: "/patient", bn: "রোগী", en: "Patient" },
};

export function RoleShell({ role, children }: { role: AppRole; children: ReactNode }) {
  const { data, isLoading } = useMyRoles();
  const { lang, setLang, t } = useLang();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: status } = useQuery({
    queryKey: ["my-account-status"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data: p } = await supabase.from("profiles").select("account_status").eq("id", u.user.id).maybeSingle();
      return p?.account_status ?? "pending";
    },
  });

  if (isLoading) return <p className="p-10 text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p>;
  const roles = data?.roles ?? [];
  if (!roles.includes(role)) return <Navigate to={homeForRoles(roles)} replace />;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (status && status !== "active" && !roles.includes("admin")) {
    const blocked = status === "blocked";
    return (
      <main className="min-h-screen px-6 py-16 md:px-16">
        <div className="max-w-xl rounded-[10px] border border-border bg-card p-6">
          <p className="font-display text-xl font-semibold text-primary">ডায়াবিকেয়ার / DiabeCare</p>
          <h1 className="mt-4 font-display text-2xl font-semibold">{blocked ? t("আপনার অ্যাকাউন্ট বন্ধ আছে।", "Your account is blocked.") : t("আপনার অ্যাকাউন্ট এখনো অনুমোদন পায়নি।", "Your account is waiting for approval.")}</h1>
          <p className="mt-2 text-muted-foreground">{blocked ? t("কোনো প্রশ্ন থাকলে আমাদের ফোন করুন।", "Please call us if you have any questions.") : t("আমরা সাধারণত এক কর্মদিবসের মধ্যে অনুমোদন দিই। অনুমোদন হলে এই পাতা নিজে খুলে যাবে।", "We usually approve within one working day. This page opens by itself once approved.")}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => qc.invalidateQueries({ queryKey: ["my-account-status"] })} className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90">{t("আবার দেখুন", "Check again")}</button>
            <button onClick={signOut} className="rounded-md border border-border px-4 py-2 font-medium transition-colors duration-150 hover:bg-secondary">{t("বের হন", "Sign out")}</button>
          </div>
        </div>
      </main>
    );
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
          {roles.includes("doctor") && <div className="ml-3 space-y-0.5 border-l border-border pl-2 text-sm">
            <Link to="/doctor" hash="pending" className="block rounded-md px-3 py-1.5 hover:bg-secondary">{t("অপেক্ষমাণ অনুরোধ", "Pending requests")}</Link>
            <Link to="/doctor" hash="today" className="block rounded-md px-3 py-1.5 hover:bg-secondary">{t("আজকের রোগী", "Today's patients")}</Link>
            <Link to="/doctor" hash="all" className="block rounded-md px-3 py-1.5 hover:bg-secondary">{t("সব অ্যাপয়েন্টমেন্ট", "All appointments")}</Link>
          </div>}
          {roles.includes("doctor") && <Link to="/doctor-analytics" className="block rounded-md px-3 py-2 hover:bg-secondary" activeProps={{ className: "bg-secondary text-primary font-medium" }}>{t("আমার পরিসংখ্যান", "My analytics")}</Link>}
          {roles.includes("doctor") && <Link to="/doctor-messages" search={{}} className="block rounded-md px-3 py-2 hover:bg-secondary" activeProps={{ className: "bg-secondary text-primary font-medium" }}>{t("রোগীদের বার্তা", "Patient messages")}</Link>}
          {roles.includes("doctor") && <Link to="/doctor-schedule" className="block rounded-md px-3 py-2 hover:bg-secondary" activeProps={{ className: "bg-secondary text-primary font-medium" }}>{t("সময়সূচি ও উপলব্ধতা", "Schedule & availability")}</Link>}
          {roles.includes("doctor") && (
            <Link to="/doctor-profile" className="block rounded-md px-3 py-2 hover:bg-secondary" activeProps={{ className: "bg-secondary text-primary font-medium" }}>
              {t("ডাক্তারের প্রোফাইল", "Doctor profile")}
            </Link>
          )}
          {roles.includes("doctor") && (
            <Link to="/diet-templates" className="block rounded-md px-3 py-2 hover:bg-secondary" activeProps={{ className: "bg-secondary text-primary font-medium" }}>
              {t("খাদ্য তালিকা বানান", "Diet charts")}
            </Link>
          )}
          {roles.includes("patient") && (
            <Link to="/my-diet" className="block rounded-md px-3 py-2 hover:bg-secondary" activeProps={{ className: "bg-secondary text-primary font-medium" }}>
              {t("আমার খাদ্য তালিকা", "My diet")}
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
      <main className="min-w-0 p-6 md:p-10">
        <div className="mb-4 flex justify-end"><Notifications isDoctor={roles.includes("doctor")} /></div>
        {children}
      </main>
    </div>
  );
}

const chip = "rounded-md border border-border bg-background px-2 py-2 text-center font-medium text-primary transition-colors duration-150 hover:border-primary hover:bg-secondary aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground";
const row = "flex items-center justify-between rounded-md px-3 py-2 text-foreground transition-colors duration-150 hover:bg-secondary hover:text-primary";
