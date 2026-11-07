import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { pageHead } from "@/lib/appointments";

export const Route = createFileRoute("/_authenticated/admin/api-settings")({
  head: () => pageHead("SMS API setup", "Prepare Automas SMS connection settings for DiabeCare doctor appointment notifications."),
  component: Page,
});

function Page() {
  const { t } = useLang();
  const [auth, setAuth] = useState("key");
  const input = "mt-1 w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-sm disabled:bg-secondary disabled:text-muted-foreground";
  const field = (bn: string, en: string, placeholder: string, type = "text") => <label className="block">{t(bn, en)}<input type={type} placeholder={placeholder} className={input} autoComplete="off" /></label>;
  return <div className="max-w-4xl">
    <h1 className="font-display text-2xl font-semibold">{t("SMS API সেটআপ", "SMS API setup")}</h1>
    <div className="mt-4 border-l-2 border-accent bg-secondary px-4 py-3 text-sm">
      <p className="font-medium text-accent">{t("এখনো সংযুক্ত নয়", "Not connected")}</p>
      <p className="mt-1">{t("Automas-এর প্রকাশ্য ডকুমেন্টেশন অনুযায়ী ঘরগুলো দেওয়া হয়েছে। ব্যালেন্স যাচাইয়ের ঠিকানা নিশ্চিত নয়; সংরক্ষণ ও SMS পাঠানো এখন চালু নেই।", "Fields follow Automas public documentation. The balance verification endpoint is unconfirmed; saving and sending SMS are not available yet.")}</p>
      <a href="https://sms.automas.com.bd/api" target="_blank" rel="noreferrer" className="mt-2 inline-block break-all text-primary underline">{t("Automas ডকুমেন্টেশন খুলুন", "Open Automas documentation")}</a>
    </div>
    <section className="mt-6 border-t border-border pt-4">
      <h2 className="text-base font-semibold">{t("সেবার তথ্য", "Provider settings")}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="block">{t("SMS সেবা", "SMS provider")}<input readOnly value="Automas SMS" className={input} /></label>
        {field("API-এর মূল ঠিকানা", "API base URL", "https://api.automas.com.bd", "url")}
        {field("SMS পাঠানোর ঠিকানা", "Send SMS endpoint", "/smsapiv3 (GET / POST)")}
        {field("JSON SMS-এর ঠিকানা", "JSON SMS endpoint", "/smsapiv4")}
        {field("আলাদা বার্তা পাঠানোর ঠিকানা", "Personalized SMS endpoint", "/smsapimany")}
        {field("ব্যালেন্স দেখার ঠিকানা", "Balance endpoint", t("থাকলে ডকুমেন্টেশন থেকে দিন", "If available in the documentation"))}
        {field("প্রেরকের পরিচয় (sender)", "Sender ID (sender)", t("সেবা থেকে পাওয়া অনুমোদিত Sender ID", "Approved sender ID supplied by the provider"))}
        <label className="block">{t("যাচাইয়ের ধরন", "Authentication method")}<select value={auth} onChange={e => setAuth(e.target.value)} className={input}>
          <option value="">{t("ডকুমেন্টেশন দেখে বেছে নিতে হবে", "Choose after checking documentation")}</option>
          <option value="key">{t("API কী / টোকেন", "API key / token")}</option>
          <option value="login">{t("ইউজারনেম ও পাসওয়ার্ড", "Username and password")}</option>
        </select></label>
      </div>
    </section>
    <section className="mt-6 border-t border-border pt-4">
      <h2 className="text-base font-semibold">{t("গোপন সংযোগ তথ্য", "Private connection credentials")}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {auth !== "login" && <label className="block">{t("API কী (apikey)", "API key (apikey)")}<input disabled type="password" placeholder={t("নিরাপত্তার জন্য এখানে কী দেখানো হয় না", "Keys are never displayed here for security")} className={input} /></label>}
        {auth === "login" && <><label className="block">{t("ইউজারনেম", "Username")}<input disabled placeholder={t("নিরাপদ সংযোগের সময় যোগ হবে", "Added during secure connection setup")} className={input} /></label><label className="block">{t("পাসওয়ার্ড", "Password")}<input disabled type="password" placeholder={t("নিরাপদ সংযোগের সময় যোগ হবে", "Added during secure connection setup")} className={input} /></label></>}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t("API কী শুধু আলাদা নিরাপদ ফর্মে দিন। এটি এনক্রিপ্ট করে রাখা হয়; এই পাতায়, সাইটের লেখায় বা ব্রাউজারে রাখা হয় না। কী বদলাতে Lovable-এর Project Settings → Secrets খুলুন। শুধু কী রাখলেই SMS পাঠানো চালু হবে না।", "Enter the API key only through the separate secure form. It is encrypted, never stored on this page, in public site content or in browser storage. To replace it, open Lovable Project Settings → Secrets. Storing a key does not enable SMS sending.")}</p>
    </section>
    <section className="mt-6 border-t border-border pt-4">
      <h2 className="text-base font-semibold">{t("অ্যাপয়েন্টমেন্টের SMS", "Appointment SMS")}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {field("পরীক্ষার মোবাইল নম্বর (msisdn)", "Test mobile number (msisdn)", t("উদাহরণ: ০১৭XXXXXXXX", "Example: 017XXXXXXXX"), "tel")}
        <label className="flex items-center gap-2 self-end py-2 text-muted-foreground"><input type="checkbox" disabled />{t("ডাক্তারকে বুকিংয়ের SMS পাঠান", "Send booking SMS to doctors")}</label>
        <label className="block sm:col-span-2">{t("SMS-এর লেখা (smstext)", "SMS message (smstext)")}<textarea rows={4} className={input} placeholder={t("ডাক্তার সাহেব, আপনার নতুন অ্যাপয়েন্টমেন্ট আছে। সময়: {time}। বিস্তারিত: {link}", "Doctor, you have a new appointment. Time: {time}. Details: {link}")} /></label>
      </div>
    </section>
  </div>;
}