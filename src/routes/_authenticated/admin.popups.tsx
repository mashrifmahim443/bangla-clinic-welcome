import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka } from "@/lib/locale";
import { pageHead } from "@/lib/appointments";
import type { PopupAudience } from "@/lib/popup-messages";

export const Route = createFileRoute("/_authenticated/admin/popups")({
  head: () => pageHead("Popup messages", "Manage DiabeCare popup announcements for doctors and patients."),
  component: Page,
});

const empty = { title_bn: "", title_en: "", body_bn: "", body_en: "", audience: "both" as PopupAudience };
function Page() {
  const { t, lang } = useLang();
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [failed, setFailed] = useState(false);
  const messages = useQuery({ queryKey: ["admin-popup-messages"], queryFn: async () => {
    const { data, error } = await supabase.from("popup_messages").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }});
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setNotice(""); setFailed(false);
    try {
      const { error } = await supabase.from("popup_messages").insert({ ...form, title_bn: form.title_bn.trim(), body_bn: form.body_bn.trim() });
      if (error) throw error;
      setForm(empty); await messages.refetch();
      setNotice(t("বার্তা চালু হয়েছে।", "Message is now active."));
    } catch { setFailed(true); setNotice(t("বার্তা সংরক্ষণ হয়নি। আবার চেষ্টা করুন।", "Message was not saved. Please try again.")); }
    finally { setBusy(false); }
  }
  async function toggle(id: string, active: boolean) {
    setBusy(true); setNotice(""); setFailed(false);
    const { error } = await supabase.from("popup_messages").update({ active: !active }).eq("id", id);
    if (error) { setFailed(true); setNotice(t("বার্তার অবস্থা বদলানো যায়নি।", "Could not change message status.")); }
    else await messages.refetch();
    setBusy(false);
  }
  const audienceLabel = (audience: string) => audience === "doctor" ? t("ডাক্তার", "Doctors") : audience === "patient" ? t("রোগী", "Patients") : t("ডাক্তার ও রোগী", "Doctors and patients");
  const input = "mt-1 w-full rounded-md border border-input bg-card px-3 py-2";
  return <div className="max-w-5xl">
    <h1 className="font-display text-2xl font-semibold">{t("পপআপ বার্তা", "Popup messages")}</h1>
    <form onSubmit={save} className="mt-5 border-y border-border py-5">
      <label className="block max-w-sm">{t("কাদের দেখাবেন", "Show to")}<select className={input} value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value as PopupAudience })}><option value="both">{audienceLabel("both")}</option><option value="doctor">{audienceLabel("doctor")}</option><option value="patient">{audienceLabel("patient")}</option></select></label>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label>{t("শিরোনাম — বাংলা", "Title — Bangla")}<input required maxLength={120} value={form.title_bn} onChange={e => setForm({ ...form, title_bn: e.target.value })} className={input} /></label>
        <label>{t("শিরোনাম — ইংরেজি (ইচ্ছামতো)", "Title — English (optional)")}<input maxLength={120} value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} className={input} /></label>
        <label>{t("বার্তা — বাংলা", "Message — Bangla")}<textarea required rows={5} maxLength={3000} value={form.body_bn} onChange={e => setForm({ ...form, body_bn: e.target.value })} className={input} /></label>
        <label>{t("বার্তা — ইংরেজি (ইচ্ছামতো)", "Message — English (optional)")}<textarea rows={5} maxLength={3000} value={form.body_en} onChange={e => setForm({ ...form, body_en: e.target.value })} className={input} /></label>
      </div>
      <Button type="submit" disabled={busy} className="mt-4">{busy ? t("সংরক্ষণ হচ্ছে…", "Saving…") : t("পপআপ বার্তা চালু করুন", "Activate popup message")}</Button>
    </form>
    {notice && <p role={failed ? "alert" : "status"} className={`mt-3 ${failed ? "text-destructive" : "text-primary"}`}>{notice}</p>}
    <h2 className="mt-6 text-lg font-semibold">{t("বার্তার তালিকা", "Message history")}</h2>
    {messages.isLoading && <p className="mt-3">{t("লোড হচ্ছে…", "Loading…")}</p>}
    {messages.error && <p role="alert" className="mt-3 text-destructive">{t("বার্তার তালিকা পড়া যায়নি।", "Could not load messages.")}<Button variant="outline" className="ml-2" onClick={() => void messages.refetch()}>{t("আবার দেখুন", "Try again")}</Button></p>}
    {messages.data?.length === 0 && <p className="mt-3 text-muted-foreground">{t("এখনো কোনো বার্তা নেই।", "No messages yet.")}</p>}
    <div className="mt-3 divide-y divide-border border-y border-border">
      {messages.data?.map(message => <div key={message.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
        <div className="min-w-0 flex-1 basis-60"><h3 className="break-words font-semibold">{t(message.title_bn, message.title_en || message.title_bn)}</h3><p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{t(message.body_bn, message.body_en || message.body_bn)}</p><p className="mt-2 text-xs text-muted-foreground">{audienceLabel(message.audience)} · {formatDhaka(new Date(message.created_at), lang)} · {message.active ? t("চালু", "Active") : t("বন্ধ", "Inactive")}</p></div>
        <Button variant="outline" disabled={busy} onClick={() => void toggle(message.id, message.active)}>{message.active ? t("বার্তা বন্ধ করুন", "Deactivate") : t("আবার চালু করুন", "Reactivate")}</Button>
      </div>)}
    </div>
  </div>;
}