import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/site-header";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — DiabeCare" },
      { name: "description", content: "Choose a new password for your DiabeCare account." },
      { property: "og:title", content: "Set a new password — DiabeCare" },
      { property: "og:description", content: "Choose a new password for your account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const isRecovery = window.location.hash.includes("type=recovery");
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") { setReady(true); setChecked(true); }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && (isRecovery || ready)) setReady(true);
      setTimeout(() => setChecked(true), 1200);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (pw.length < 6) return setMsg({ kind: "err", text: t("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।", "Password must be at least 6 characters.") });
    if (pw !== pw2) return setMsg({ kind: "err", text: t("দুটো পাসওয়ার্ড মিলছে না।", "The two passwords don't match.") });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      const weak = /weak|easy to guess|pwned/i.test(error.message);
      setMsg({ kind: "err", text: `${error.message} — ${weak ? t("আরেকটু কঠিন পাসওয়ার্ড দিন।", "Pick a harder password.") : t("পাসওয়ার্ড বদলানো গেল না।", "Couldn't change the password.")}` });
      return;
    }
    setMsg({ kind: "ok", text: t("নতুন পাসওয়ার্ড সেট হয়েছে। ড্যাশবোর্ডে নিয়ে যাচ্ছি…", "New password set. Taking you to your dashboard…") });
    setTimeout(() => navigate({ to: "/dashboard" }), 1200);
  }

  const input = "w-full rounded-md border border-border bg-card px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-14">
        <div className="rounded-[10px] border border-border bg-card p-8">
          <h1 className="font-display text-3xl font-semibold">{t("নতুন পাসওয়ার্ড দিন", "Set a new password")}</h1>
          {!ready ? (
            <p className="mt-3 text-muted-foreground">
              {checked
                ? <>{t("লিংকটা কাজ করছে না বা মেয়াদ শেষ। আবার লিংক চেয়ে নিন।", "This link isn't valid or has expired. Please ask for a new one.")}{" "}
                    <Link to="/forgot-password" className="text-primary underline underline-offset-4">{t("নতুন লিংক চান", "Get a new link")}</Link></>
                : t("লিংক যাচাই হচ্ছে…", "Checking your link…")}
            </p>
          ) : (
            <form onSubmit={submit} noValidate className="mt-7 space-y-5">
              <div>
                <label htmlFor="pw" className="mb-1.5 block font-medium">{t("নতুন পাসওয়ার্ড", "New password")}</label>
                <input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className={input} />
              </div>
              <div>
                <label htmlFor="pw2" className="mb-1.5 block font-medium">{t("আবার লিখুন", "Type it again")}</label>
                <input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} className={input} />
              </div>
              {msg && <p className={`rounded-md border px-3 py-2 text-sm ${msg.kind === "ok" ? "border-glucose-ok text-glucose-ok" : "border-destructive text-destructive"}`}>{msg.text}</p>}
              <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {busy ? t("একটু অপেক্ষা করুন…", "Please wait…") : t("পাসওয়ার্ড সেট করুন", "Save password")}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
