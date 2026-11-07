import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { useCms, saveContent, siteContentQuery } from "@/lib/cms";
import { INTEGRATIONS_KEY, integrationUrlError, withDefaults, type Integrations } from "@/lib/integrations";

type Row = { k: keyof Integrations; label: [string, string]; url?: boolean; ph?: string };
const groups: { title: [string, string]; note: [string, string]; rows: Row[]; secret?: [string, string] }[] = [
  { title: ["ভিডিও কল", "Video call"], note: ["এখন Jitsi Meet ব্যবহার হচ্ছে। অন্য সার্ভার দিলে নতুন কল সেখানে খুলবে।", "Jitsi Meet is used now. A different server opens new calls there."], rows: [{ k: "jitsi_base", label: ["ভিডিও কলের ঠিকানা", "Video call base URL"], url: true }] },
  { title: ["BMDC যাচাই", "BMDC verification"], note: ["ডাক্তারের আবেদন দেখার সময় এই লিংক খোলে।", "Opened while reviewing doctor applications."], rows: [{ k: "bmdc_verify", label: ["যাচাইয়ের ঠিকানা", "Verification URL"], url: true }] },
  { title: ["WhatsApp", "WhatsApp"], note: ["চ্যাট লিংক তৈরির মূল ঠিকানা।", "Base address for chat links."], rows: [{ k: "whatsapp_base", label: ["WhatsApp লিংক", "WhatsApp link base"], url: true }] },
  { title: ["পেমেন্ট (এখনো চালু নেই)", "Payments (not enabled yet)"], note: ["বিকাশ, নগদ বা SSLCommerz যুক্ত করার জন্য জায়গা রাখা হলো।", "Placeholder for bKash, Nagad or SSLCommerz."], secret: ["স্টোর পাসওয়ার্ড / সিক্রেট কী", "Store password / secret key"], rows: [
    { k: "payment_provider", label: ["পেমেন্ট সেবা", "Payment provider"], ph: "bKash / SSLCommerz" },
    { k: "payment_base", label: ["API-এর মূল ঠিকানা", "API base URL"], url: true, ph: "https://" },
    { k: "payment_merchant", label: ["মার্চেন্ট / স্টোর আইডি", "Merchant / store ID"] } ] },
  { title: ["ইমেইল (এখনো চালু নেই)", "Email (not enabled yet)"], note: ["ডাক্তারকে বুকিংয়ের ইমেইল পাঠানোর জন্য।", "For booking emails to doctors."], secret: ["ইমেইল API কী", "Email API key"], rows: [
    { k: "email_provider", label: ["ইমেইল সেবা", "Email provider"] },
    { k: "email_sender", label: ["প্রেরকের ইমেইল", "Sender email"], ph: "noreply@yourdomain.com" } ] },
];

export function IntegrationsSettings() {
  const { t } = useLang();
  const { json } = useCms();
  const qc = useQueryClient();
  const saved = withDefaults(json<Partial<Integrations> | null>(INTEGRATIONS_KEY, null));
  const [v, setV] = useState<Integrations>(saved);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const savedKey = JSON.stringify(saved);
  useEffect(() => { setV(JSON.parse(savedKey)); }, [savedKey]);
  const input = "mt-1 w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-sm disabled:bg-secondary disabled:text-muted-foreground";
  const save = async () => {
    const bad = groups.flatMap(g => g.rows).find(r => r.url && integrationUrlError(v[r.k]));
    if (bad) { setMsg({ ok: false, text: t(`"${bad.label[0]}" ঠিকানাটি https:// দিয়ে শুরু হতে হবে।`, `"${bad.label[1]}" must start with https://.`) }); return; }
    setBusy(true);
    const { error } = await saveContent(INTEGRATIONS_KEY, v);
    setBusy(false);
    if (error) { setMsg({ ok: false, text: t("সংরক্ষণ হয়নি: ", "Not saved: ") + error.message }); return; }
    await qc.invalidateQueries({ queryKey: siteContentQuery.queryKey });
    setMsg({ ok: true, text: t("সেবার ঠিকানাগুলো সংরক্ষণ হয়েছে।", "Service settings saved.") });
  };
  return <section id="other-apis" className="mt-10 scroll-mt-4 border-t-2 border-border pt-6">
    <h2 className="font-display text-xl font-semibold">{t("অন্যান্য বাইরের সেবা", "Other outside services")}</h2>
    <p className="mt-1 text-sm text-muted-foreground">{t("এখানে শুধু খোলা ঠিকানা ও আইডি রাখুন। গোপন কী এখানে লেখা যায় না; সেগুলো Project Settings → Secrets-এ থাকে।", "Only public addresses and IDs go here. Secret keys can't be typed here; they live in Project Settings → Secrets.")}</p>
    {groups.map(g => <div key={g.title[1]} className="mt-5 border-t border-border pt-4">
      <h3 className="text-base font-semibold">{t(...g.title)}</h3>
      <p className="text-sm text-muted-foreground">{t(...g.note)}</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {g.rows.map(r => <label key={r.k} className="block text-sm">{t(...r.label)}
          <input value={v[r.k]} placeholder={r.ph} inputMode={r.url ? "url" : undefined} onChange={e => { setV({ ...v, [r.k]: e.target.value }); setMsg(null); }} className={input} autoComplete="off" /></label>)}
        {g.secret && <label className="block text-sm">{t(...g.secret)}<input disabled type="password" placeholder={t("নিরাপদ স্টোরেজে রাখা হবে", "Kept in secure storage")} className={input} /></label>}
      </div>
    </div>)}
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <Button type="button" onClick={save} disabled={busy} className="shadow-none">{busy ? t("সংরক্ষণ হচ্ছে…", "Saving…") : t("সেবার ঠিকানা সংরক্ষণ করুন", "Save service settings")}</Button>
      {msg && <p role={msg.ok ? "status" : "alert"} className={msg.ok ? "text-sm text-primary" : "text-sm text-destructive"}>{msg.text}</p>}
    </div>
  </section>;
}
