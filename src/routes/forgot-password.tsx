import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/site-header";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Diacare" },
      { name: "description", content: "Get a link by email to set a new Diacare password." },
      { property: "og:title", content: "Reset password — Diacare" },
      { property: "og:description", content: "Get a link by email to set a new password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setMsg({ kind: "err", text: t("সঠিক ইমেইল ঠিকানা লিখুন।", "Enter a valid email address.") });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) setMsg({ kind: "err", text: `${error.message} — ${t("লিংক পাঠানো গেল না।", "Couldn't send the link.")}` });
    else setMsg({ kind: "ok", text: t("এই ইমেইলে অ্যাকাউন্ট থাকলে একটা লিংক পাঠানো হয়েছে। লিংকে চাপ দিয়ে নতুন পাসওয়ার্ড দিন।", "If an account uses this email, we sent a link. Click it to set a new password.") });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-14">
        <div className="rounded-[10px] border border-border bg-card p-8">
          <h1 className="font-display text-3xl font-semibold">{t("পাসওয়ার্ড ভুলে গেছেন", "Forgot your password")}</h1>
          <p className="mt-1 text-muted-foreground">{t("অ্যাকাউন্টের ইমেইল দিন, আমরা নতুন পাসওয়ার্ডের লিংক পাঠাব।", "Enter your account email and we'll send a link to set a new password.")}</p>
          <form onSubmit={submit} noValidate className="mt-7 space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block font-medium">{t("ইমেইল", "Email")}</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-card px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-ring/30" />
            </div>
            {msg && <p className={`rounded-md border px-3 py-2 text-sm ${msg.kind === "ok" ? "border-glucose-ok text-glucose-ok" : "border-destructive text-destructive"}`}>{msg.text}</p>}
            <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {busy ? t("একটু অপেক্ষা করুন…", "Please wait…") : t("লিংক পাঠান", "Send link")}
            </button>
          </form>
          <p className="mt-6 border-t border-border pt-5 text-sm">
            <Link to="/auth" className="font-medium text-primary underline underline-offset-4">{t("লগইনে ফিরে যান", "Back to sign in")}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
