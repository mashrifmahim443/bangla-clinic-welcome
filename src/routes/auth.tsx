import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/site-header";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { next?: string | undefined } => ({
    next:
      typeof search["next"] === "string" && search["next"].startsWith("/") && !search["next"].startsWith("//")
        ? search["next"]
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Diacare" },
      { name: "description", content: "Sign in or open a Diacare account to log your sugar and see a doctor." },
      { property: "og:title", content: "Sign in — Diacare" },
      { property: "og:description", content: "Sign in or open a Diacare account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Field = "name" | "phone" | "email" | "password";
type Errors = Partial<Record<Field, string>>;

function AuthPage() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const emailRule = z.string().trim().min(1, t("ইমেইল লিখুন।", "Enter your email.")).email(t("ইমেইলটা ঠিক নেই। যেমন: rahim@gmail.com", "That email doesn't look right. Example: rahim@gmail.com")).max(255);
  const passRule = z.string().min(6, t("পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।", "Password must be at least 6 characters.")).max(72);
  const schema =
    mode === "in"
      ? z.object({ email: emailRule, password: passRule })
      : z.object({
          name: z.string().trim().min(2, t("আপনার নাম লিখুন।", "Enter your name.")).max(100, t("নাম ১০০ অক্ষরের মধ্যে রাখুন।", "Keep your name under 100 characters.")),
          phone: z
            .string()
            .trim()
            .regex(/^\d{11}$/, t("ফোন নম্বর ১১ ডিজিটের হতে হবে।", "Phone number must be 11 digits."))
            .regex(/^01[3-9]/, t("নম্বরটা ০১ দিয়ে শুরু হতে হবে, যেমন ০১৭১১০০০০০০।", "Number must start with 01, like 01711000000.")),
          email: emailRule,
          password: passRule,
        });

  function set(field: Field, value: string) {
    const v = field === "phone" ? value.replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d))).replace(/\D/g, "") : value;
    setForm((f) => ({ ...f, [field]: v }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as Field;
        if (!next[k]) next[k] = issue.message;
      }
      setErrors(next);
      return;
    }
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
      if (error) setMsg({ kind: "err", text: `${error.message}` + " — " + (/confirm/i.test(error.message) ? t("ইমেইলটা এখনো নিশ্চিত হয়নি। ইমেইলে পাঠানো লিংকে চাপ দিন, তারপর লগইন করুন।", "Your email isn't confirmed yet. Click the link we emailed you, then sign in.") : t("ইমেইল বা পাসওয়ার্ড মিলছে না। আবার চেষ্টা করুন।", "Email or password doesn't match. Please try again.")) });
      else navigate({ to: (next ?? "/dashboard") as "/dashboard" });
    } else {
      const { error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: form.name.trim(), phone: form.phone } },
      });
      if (error) setMsg({ kind: "err", text: `${error.message}` + " — " + (/weak|easy to guess|pwned/i.test(error.message) ? t("এই পাসওয়ার্ডটা খুব সহজ, অনেকে ব্যবহার করেন। অক্ষর, সংখ্যা মিলিয়ে আরেকটু কঠিন পাসওয়ার্ড দিন।", "This password is too common. Please pick a harder one mixing letters and numbers.") : /rate limit/i.test(error.message) ? t("অল্প সময়ে অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।", "Too many tries. Please wait a bit and try again.") : error.message.includes("registered") ? t("এই ইমেইলে আগেই অ্যাকাউন্ট আছে। লগইন করুন।", "An account with this email already exists. Sign in instead.") : t("অ্যাকাউন্ট খোলা গেল না। একটু পরে আবার চেষ্টা করুন।", "Couldn't open the account. Please try again shortly.")) });
      else setMsg({ kind: "ok", text: t("ইমেইলে পাঠানো লিংকে চাপ দিয়ে ইমেইল যাচাই করুন। এরপর লগইন করে ফোনে পাঠানো কোড দিয়ে মোবাইল নম্বর যাচাই করতে হবে। দুটো যাচাই বাধ্যতামূলক।", "Verify your email using the emailed link. Then sign in and verify your mobile number using an SMS code. Both verifications are required.") });
    }
    setBusy(false);
  }

  function switchMode() {
    setMode(mode === "in" ? "up" : "in");
    setErrors({});
    setMsg(null);
  }

  const fields: { key: Field; label: string; type: string; hint?: string | undefined; auto: string }[] = [
    ...(mode === "up"
      ? [
          { key: "name" as Field, label: t("আপনার নাম", "Your name"), type: "text", auto: "name" },
          { key: "phone" as Field, label: t("মোবাইল নম্বর", "Mobile number"), type: "tel", hint: t("যেমন: ০১৭১১০০০০০০", "e.g. 01711000000"), auto: "tel" },
        ]
      : []),
    { key: "email", label: t("ইমেইল", "Email"), type: "email", auto: "email" },
    { key: "password", label: t("পাসওয়ার্ড", "Password"), type: "password", hint: mode === "up" ? t("অন্তত ৬ অক্ষর", "At least 6 characters") : undefined, auto: mode === "in" ? "current-password" : "new-password" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-14">
        <div className="rounded-[10px] border border-border bg-card p-8">
          <h1 className="font-display text-3xl font-semibold">{mode === "in" ? t("লগইন করুন", "Sign in") : t("নতুন অ্যাকাউন্ট খুলুন", "Open a new account")}</h1>
          <p className="mt-1 text-muted-foreground">
            {mode === "in" ? t("আপনার ইমেইল আর পাসওয়ার্ড দিন।", "Enter your email and password.") : t("দুই মিনিট লাগবে।", "It takes two minutes.")}
          </p>
          <form onSubmit={submit} noValidate className="mt-7 space-y-5">
            {fields.map((f) => {
              const err = errors[f.key];
              return (
                <div key={f.key}>
                  <label htmlFor={f.key} className="mb-1.5 block font-medium">{f.label}</label>
                  <input
                    id={f.key}
                    type={f.type}
                    inputMode={f.key === "phone" ? "numeric" : undefined}
                    autoComplete={f.auto}
                    value={form[f.key]}
                    onChange={(e) => set(f.key, e.target.value)}
                    aria-invalid={!!err}
                    aria-describedby={`${f.key}-note`}
                    className={`w-full rounded-md border bg-card px-3 py-2.5 focus:outline-none focus:ring-2 ${err ? "border-destructive focus:ring-destructive/30" : "border-border focus:ring-ring/30"}`}
                  />
                  <p id={`${f.key}-note`} className={`mt-1 text-sm ${err ? "text-destructive" : "text-muted-foreground"}`}>
                    {err ?? f.hint ?? ""}
                  </p>
                </div>
              );
            })}
            {msg && (
              <p className={`rounded-md border px-3 py-2 text-sm ${msg.kind === "ok" ? "border-glucose-ok text-glucose-ok" : "border-destructive text-destructive"}`}>{msg.text}</p>
            )}
            <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {busy ? t("একটু অপেক্ষা করুন…", "Please wait…") : mode === "in" ? t("লগইন করুন", "Sign in") : t("অ্যাকাউন্ট খুলুন", "Open account")}
            </button>
          </form>
          {mode === "in" && (
            <p className="mt-4 text-sm">
              <Link to="/forgot-password" className="text-primary underline underline-offset-4">{t("পাসওয়ার্ড ভুলে গেছেন?", "Forgot your password?")}</Link>
            </p>
          )}
          <p className="mt-6 border-t border-border pt-5 text-sm text-muted-foreground">
            {mode === "in" ? t("নতুন এসেছেন?", "New here?") : t("আগে থেকে অ্যাকাউন্ট আছে?", "Already have an account?")}{" "}
            <button onClick={switchMode} className="font-medium text-primary underline underline-offset-4">
              {mode === "in" ? t("অ্যাকাউন্ট খুলুন", "Open an account") : t("লগইন করুন", "Sign in")}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
