import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useLocation } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { normalizeVerificationPhone, verificationRequired } from "@/lib/phone-verification";
import { sendPhoneCode, verifyPhoneCode } from "@/lib/phone-verification.functions";

export function ContactVerificationGate({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const path = useLocation({ select: l => l.pathname });
  const publicPath = ["/", "/auth", "/forgot-password", "/reset-password", "/doctors", "/diet", "/exercise", "/articles", "/subscribe"].some(p => path === p || (p !== "/" && p !== "/auth" && path.startsWith(p + "/")));
  const query = useQuery({ queryKey: ["contact-verification"], enabled: !publicPath, refetchInterval: 30000, queryFn: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    const [state, profile] = await Promise.all([
      supabase.from("registration_verifications").select("required,verified_phone,phone_verified_at").eq("user_id", auth.user.id).single(),
      supabase.from("profiles").select("phone").eq("id", auth.user.id).single(),
    ]);
    if (state.error || profile.error) throw new Error("Verification status unavailable");
    return { required: verificationRequired(state.data.required, Boolean(auth.user.email_confirmed_at), Boolean(state.data.phone_verified_at && state.data.verified_phone === profile.data.phone)), phone: profile.data.phone ?? "", emailConfirmed: Boolean(auth.user.email_confirmed_at) };
  }});
  if (publicPath) return children;
  if (query.isLoading) return <p className="p-8">{t("লোড হচ্ছে…", "Loading…")}</p>;
  if (query.error) return <main className="p-8"><p role="alert">{t("যাচাইয়ের তথ্য পড়া যায়নি।", "Could not load verification status.")}</p><Button onClick={() => void query.refetch()}>{t("আবার চেষ্টা করুন", "Try again")}</Button></main>;
  if (!query.data?.required) return children;
  return <PhoneForm phone={query.data.phone} emailConfirmed={query.data.emailConfirmed} onVerified={() => void query.refetch()} />;
}

function PhoneForm({ phone: initialPhone, emailConfirmed, onVerified }: { phone: string; emailConfirmed: boolean; onVerified: () => void }) {
  const { t } = useLang();
  const send = useServerFn(sendPhoneCode);
  const verify = useServerFn(verifyPhoneCode);
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [sent, setSent] = useState(false);
  const explain = (status: string) => {
    const messages: Record<string, [string, string]> = {
      sent: ["ফোনে কোড পাঠানো হয়েছে।", "A code has been sent to your phone."],
      cooldown: ["নতুন কোড চাইতে অন্তত ১ মিনিট অপেক্ষা করুন।", "Wait at least one minute before requesting another code."],
      rate_limited: ["বেশি বার চেষ্টা হয়েছে। এক ঘণ্টা পরে আবার চেষ্টা করুন।", "Too many requests. Try again after one hour."],
      expired: ["কোডের মেয়াদ শেষ। নতুন কোড নিন।", "The code expired. Request a new code."],
      locked: ["ভুল কোড ৫ বার দেওয়া হয়েছে। নতুন কোড নিন।", "Five incorrect attempts. Request a new code."],
      invalid: ["কোড মেলেনি। আবার দেখুন।", "The code does not match. Check it again."],
      used: ["এই কোড আগে ব্যবহার হয়েছে। নতুন কোড নিন।", "This code has already been used. Request a new code."],
      email_required: ["আগে ইমেইলের লিংকে চাপ দিয়ে ইমেইল যাচাই করুন।", "Verify your email using the emailed link first."],
      unknown: ["SMS পৌঁছেছে কি না জানা যায়নি। কোড পেলে লিখুন; আবার পাঠাতে একটু অপেক্ষা করুন।", "SMS delivery is uncertain. Enter the code if received; wait before resending."],
    };
    return t(...(messages[status] ?? ["কোড পাঠানো বা যাচাই করা যায়নি। একটু পরে চেষ্টা করুন।", "Could not send or verify the code. Please try again later."]));
  };
  async function sendCode() {
    const normalized = normalizeVerificationPhone(phone);
    if (!/^01[3-9]\d{8}$/.test(normalized)) { setNotice(t("সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।", "Enter a valid 11-digit mobile number.")); return; }
    setBusy(true);
    try { const result = await send({ data: { phone: normalized } }); setNotice(explain(result.status)); if (["sent", "unknown"].includes(result.status)) setSent(true); }
    catch { setNotice(explain("unavailable")); }
    finally { setBusy(false); }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) { setNotice(t("৬ ডিজিটের কোড লিখুন।", "Enter the six-digit code.")); return; }
    setBusy(true);
    try { const result = await verify({ data: { code } }); if (result.status === "verified") onVerified(); else setNotice(explain(result.status)); }
    catch { setNotice(explain("unavailable")); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-lg px-6 py-12"><p className="font-display text-xl font-semibold text-primary">Diacare</p><h1 className="mt-6 font-display text-3xl font-semibold">{t("ফোন নম্বর যাচাই করুন", "Verify your phone number")}</h1><p className="mt-3">{emailConfirmed ? t("ইমেইল যাচাই হয়েছে। এবার ফোনে পাঠানো কোড লিখুন।", "Your email is verified. Now enter the code sent to your phone.") : explain("email_required")}</p><div className="mt-6 rounded-md border border-border bg-card p-6"><label className="block">{t("মোবাইল নম্বর", "Mobile number")}<input className="mt-2 w-full rounded-md border border-input bg-card px-3 py-3" type="tel" value={phone} onChange={e => { setPhone(e.target.value); setSent(false); }} /></label><Button className="mt-3" disabled={busy || !emailConfirmed} onClick={() => void sendCode()}>{sent ? t("আবার কোড পাঠান", "Resend code") : t("ফোনে কোড পাঠান", "Send code to phone")}</Button><form onSubmit={submit} className="mt-6"><label className="block">{t("৬ ডিজিটের কোড", "Six-digit code")}<input autoComplete="one-time-code" inputMode="numeric" maxLength={6} className="mt-2 w-full rounded-md border border-input bg-card px-3 py-3 text-lg" value={code} onChange={e => setCode(e.target.value.replace(/[০-৯]/g,d=>String("০১২৩৪৫৬৭৮৯".indexOf(d))).replace(/\D/g,""))} /></label><Button type="submit" className="mt-3 w-full" disabled={busy || !emailConfirmed}>{busy ? t("একটু অপেক্ষা করুন…", "Please wait…") : t("ফোন যাচাই করুন", "Verify phone")}</Button></form>{notice && <p role="status" className="mt-4 text-sm">{notice}</p>}</div></main>;
}