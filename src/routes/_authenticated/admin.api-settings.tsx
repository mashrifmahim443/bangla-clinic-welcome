import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { defaultSmsSettings, smsSettingsPayload, smsSettingsError } from "@/lib/sms-settings";
import { useLang } from "@/lib/i18n";
import { pageHead } from "@/lib/appointments";

export const Route = createFileRoute("/_authenticated/admin/api-settings")({
  head: () => pageHead("SMS API setup", "Prepare Automas SMS connection settings for DiabeCare doctor appointment notifications."),
  component: Page,
});

function Page() {
  const { t } = useLang();
  const [settings, setSettings] = useState(defaultSmsSettings);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [failed, setFailed] = useState(false);
  const saved = useQuery({ queryKey: ["admin-sms-settings"], queryFn: async () => {
    const { data, error } = await supabase.from("sms_settings").select("sender_id,test_number,message_template").eq("id", "automas").maybeSingle();
    if (error) throw error;
    return data;
  }});
  useEffect(() => { if (saved.data) setSettings(saved.data); }, [saved.data]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(""); setFailed(false);
    const invalid = smsSettingsError(settings);
    if (invalid) {
      setFailed(true);
      setNotice(invalid === "sender" ? t("অনুমোদিত Sender ID দিন (৩–৩২ অক্ষর)।", "Enter an approved sender ID (3–32 characters).") : invalid === "number" ? t("মোবাইল নম্বর ১১ ডিজিটের হতে হবে, অথবা 880 দিয়ে শুরু হতে হবে।", "Use an 11-digit mobile number or the 880 format.") : t("বার্তা ১০০০ অক্ষরের মধ্যে লিখুন।", "Keep the message within 1000 characters."));
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("sms_settings").upsert(smsSettingsPayload(settings));
      if (error) throw error;
      await saved.refetch();
      setNotice(t("SMS সেটিংস সংরক্ষণ হয়েছে।", "SMS settings saved."));
    } catch (error) {
      setFailed(true);
      setNotice(t("সংরক্ষণ হয়নি: ", "Not saved: ") + (error instanceof Error ? error.message : (error as { message?: string }).message ?? t("আবার চেষ্টা করুন।", "Please try again.")));
    } finally { setSaving(false); }
  };
  const input = "mt-1 w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-sm disabled:bg-secondary disabled:text-muted-foreground";
  const field = (bn: string, en: string, placeholder: string, type = "text") => <label className="block">{t(bn, en)}<input type={type} placeholder={placeholder} className={input} autoComplete="off" /></label>;
  return <form onSubmit={save} className="max-w-4xl">
    <h1 className="font-display text-2xl font-semibold">{t("SMS API সেটআপ", "SMS API setup")}</h1>
    <div className="mt-4 border-l-2 border-accent bg-secondary px-4 py-3 text-sm">
      <p className="font-medium text-accent">{t("স্বয়ংক্রিয় SMS এখনো চালু নেই", "Automatic SMS is not enabled yet")}</p>
      <p className="mt-1">{t("Sender ID, পরীক্ষার নম্বর ও বার্তা সংরক্ষণ করতে পারবেন। API কী আলাদা নিরাপদ স্টোরেজে থাকে।", "You can save the sender ID, test number and message. The API key stays in separate secure storage.")}</p>
      <a href="https://sms.automas.com.bd/api" target="_blank" rel="noreferrer" className="mt-2 inline-block break-all text-primary underline">{t("Automas ডকুমেন্টেশন খুলুন", "Open Automas documentation")}</a>
    </div>
    <section className="mt-6 border-t border-border pt-4">
      <h2 className="text-base font-semibold">{t("সেবার তথ্য", "Provider settings")}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="block">{t("SMS সেবা", "SMS provider")}<input readOnly value="Automas SMS" className={input} /></label>
        <label className="block">{t("API-এর মূল ঠিকানা", "API base URL")}<input readOnly value="https://api.automas.com.bd" className={input} /></label>
        <label className="block">{t("SMS পাঠানোর ঠিকানা", "Send SMS endpoint")}<input readOnly value="/smsapiv3 (POST)" className={input} /></label>
        <label className="block">{t("প্রেরকের পরিচয় (sender)", "Sender ID (sender)")}<input required value={settings.sender_id} maxLength={32} onChange={e => { setSettings({ ...settings, sender_id: e.target.value }); setNotice(""); }} className={input} autoComplete="off" /></label>
      </div>
    </section>
    <section className="mt-6 border-t border-border pt-4">
      <h2 className="text-base font-semibold">{t("গোপন সংযোগ তথ্য", "Private connection credentials")}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="block">{t("API কী (apikey)", "API key (apikey)")}<input disabled type="password" placeholder={t("নিরাপত্তার জন্য এখানে কী দেখানো হয় না", "Keys are never displayed here for security")} className={input} /></label>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t("API কী শুধু আলাদা নিরাপদ ফর্মে দিন। এটি এনক্রিপ্ট করে রাখা হয়; এই পাতায়, সাইটের লেখায় বা ব্রাউজারে রাখা হয় না। কী বদলাতে Lovable-এর Project Settings → Secrets খুলুন। শুধু কী রাখলেই SMS পাঠানো চালু হবে না।", "Enter the API key only through the separate secure form. It is encrypted, never stored on this page, in public site content or in browser storage. To replace it, open Lovable Project Settings → Secrets. Storing a key does not enable SMS sending.")}</p>
    </section>
    <section className="mt-6 border-t border-border pt-4">
      <h2 className="text-base font-semibold">{t("অ্যাপয়েন্টমেন্টের SMS", "Appointment SMS")}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="block">{t("পরীক্ষার মোবাইল নম্বর (msisdn)", "Test mobile number (msisdn)")}<input type="tel" value={settings.test_number} onChange={e => { setSettings({ ...settings, test_number: e.target.value }); setNotice(""); }} className={input} /></label>
        <label className="flex items-center gap-2 self-end py-2 text-muted-foreground"><input type="checkbox" disabled />{t("ডাক্তারকে বুকিংয়ের SMS পাঠান", "Send booking SMS to doctors")}</label>
        <label className="block sm:col-span-2">{t("SMS-এর লেখা (smstext)", "SMS message (smstext)")}<textarea rows={4} maxLength={1000} value={settings.message_template} onChange={e => { setSettings({ ...settings, message_template: e.target.value }); setNotice(""); }} className={input} /></label>
      </div>
    </section>
    {saved.error && <p role="alert" className="mt-3 text-sm text-destructive">{t("আগের সেটিংস পড়া যায়নি: ", "Could not load saved settings: ")}{saved.error.message}</p>}
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
      <Button type="submit" disabled={saving || saved.isLoading || Boolean(saved.error)} className="shadow-none">{saving ? t("সংরক্ষণ হচ্ছে…", "Saving…") : t("SMS সেটিংস সংরক্ষণ করুন", "Save SMS settings")}</Button>
      {notice && <p role={failed ? "alert" : "status"} className={failed ? "text-sm text-destructive" : "text-sm text-primary"}>{notice}</p>}
    </div>
  </form>;
}