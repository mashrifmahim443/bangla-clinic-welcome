import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/site-header";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — DiabeCare" },
      { name: "description", content: "Sign in or open a DiabeCare account to log your sugar and see a doctor." },
      { property: "og:title", content: "Sign in — DiabeCare" },
      { property: "og:description", content: "Sign in or open a DiabeCare account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else navigate({ to: "/dashboard" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      setMsg(error ? error.message : t("ইমেইলে একটা লিংক পাঠানো হয়েছে। সেটায় চাপ দিয়ে অ্যাকাউন্ট নিশ্চিত করুন।", "We sent a link to your email. Click it to confirm your account."));
    }
    setBusy(false);
  }

  const input = "w-full rounded-md border border-border bg-card px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-3xl font-semibold">{mode === "in" ? t("ঢুকুন", "Sign in") : t("অ্যাকাউন্ট খুলুন", "Open an account")}</h1>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm">{t("ইমেইল", "Email")}</span>
            <input className={input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm">{t("পাসওয়ার্ড", "Password")}</span>
            <input className={input} type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {msg && <p className="text-sm text-accent">{msg}</p>}
          <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {mode === "in" ? t("ঢুকুন", "Sign in") : t("অ্যাকাউন্ট খুলুন", "Open account")}
          </button>
        </form>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-6 text-sm text-primary underline underline-offset-4">
          {mode === "in" ? t("নতুন? অ্যাকাউন্ট খুলুন", "New here? Open an account") : t("আগে থেকে অ্যাকাউন্ট আছে? ঢুকুন", "Have an account? Sign in")}
        </button>
      </main>
    </div>
  );
}
