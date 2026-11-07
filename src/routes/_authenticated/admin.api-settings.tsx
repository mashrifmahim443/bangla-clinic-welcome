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
  const [auth, setAuth] = useState("");
  const input = "mt-1 w-full min-w-0 rounded-md border border-input bg-card px-3 py-2 text-sm disabled:bg-secondary disabled:text-muted-foreground";
  const field = (bn: string, en: string, placeholder: string, type = "text") => <label className="block">{t(bn, en)}<input type={type} placeholder={placeholder} className={input} autoComplete="off" /></label>;
  return <div className="max-w-4xl">
    <h1 className="font-display text-2xl font-semibold">{t("SMS API সেটআপ", "SMS API setup")}</h1>
    <div className="mt-4 border-l-2 border-accent bg-secondary px-4 py-3 text-sm">
      <p className="font-medium text-accent">{t("এখনো সংযুক্ত নয়", "Not connected")}</p>
      <p className="mt-1">{t("ডকুমেন্টেশন খুলতে যাচাই চাইছে। নিচের ঘরগুলো খসড়া; সংরক্ষণ বা SMS পাঠানো এখন চালু নেই।", "The documentation requires a verification check. These fields are drafts; saving and sending SMS are not available yet.")}</p>
      <a href="https://asms.automas.com.bd/developer" target="_blank" rel="noreferrer" className="mt-2 inline-block break-all text-primary underline">{t("Automas ডকুমেন্টেশন খুলুন", "Open Automas documentation")}</a>
    </div>
    <section className="mt-6 border-t border-border pt-4">
      <h2 className="text-base font-semibold">{t("সেবার তথ্য", "Provider settings")}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="block">{t("SMS সেবা", "SMS provider")}<input readOnly value="Automas SMS" className={input} /></label>
        {field("API-এর মূল ঠিকানা", "API base URL", t("ডকুমেন্টেশনে দেওয়া HTTPS ঠিকানা", "HTTPS URL from the documentation"), "url")}
        {field("SMS পাঠানোর ঠিকানা", "Send SMS endpoint", t("ডকুমেন্টেশনে দেওয়া ঠিকানা", "Endpoint from the documentation"))}
        {field("ব্যালেন্স দেখার ঠিকানা", "Balance endpoint", t("থাকলে ডকুমেন্টেশন থেকে দিন", "If available in the documentation"))}
        {field("প্রেরকের পরিচয় (Sender ID)", "Sender ID", t("সেবা থেকে পাওয়া Sender ID", "Sender ID supplied by the provider"))}
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
        {auth !== "login" && <label className="block">{t("API কী / টোকেন", "API key / token")}<input disabled type="password" placeholder={t("নিরাপদ সংযোগ চালু হলে এখানে যোগ হবে", "Available after secure connection setup")} className={input} /></label>}
        {auth === "login" && <><label className="block">{t("ইউজারনেম", "Username")}<input disabled placeholder={t("নিরাপদ সংযোগের সময় যোগ হবে", "Added during secure connection setup")} className={input} /></label><label className="block">{t("পাসওয়ার্ড", "Password")}<input disabled type="password" placeholder={t("নিরাপদ সংযোগের সময় যোগ হবে", "Added during secure connection setup")} className={input} /></label></>}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t("গোপন কী বা পাসওয়ার্ড সাধারণ সাইটের লেখার সঙ্গে রাখা হবে না।", "Private keys and passwords will not be stored with public site content.")}</p>
    </section>
    <section className="mt-6 border-t border-border pt-4">
      <h2 className="text-base font-semibold">{t("অ্যাপয়েন্টমেন্টের SMS", "Appointment SMS")}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {field("পরীক্ষার মোবাইল নম্বর", "Test mobile number", t("উদাহরণ: ০১৭XXXXXXXX", "Example: 017XXXXXXXX"), "tel")}
        <label className="flex items-center gap-2 self-end py-2 text-muted-foreground"><input type="checkbox" disabled />{t("ডাক্তারকে বুকিংয়ের SMS পাঠান", "Send booking SMS to doctors")}</label>
        <label className="block sm:col-span-2">{t("SMS-এর লেখা", "SMS message")}<textarea rows={4} className={input} placeholder={t("ডাক্তার সাহেব, আপনার নতুন অ্যাপয়েন্টমেন্ট আছে। সময়: {time}। বিস্তারিত: {link}", "Doctor, you have a new appointment. Time: {time}. Details: {link}")} /></label>
      </div>
    </section>
  </div>;
}