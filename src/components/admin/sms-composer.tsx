import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { formatNumber } from "@/lib/locale";
import { sendCustomSms } from "@/lib/sms.functions";
import { validSmsRecipient } from "@/lib/sms-send";

export function SmsComposer() {
  const { t, lang } = useLang();
  const send = useServerFn(sendCustomSms);
  const cache = useQueryClient();
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const input = "mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm";
  async function submit() {
    if (sending) return;
    setAccepted(false);
    if (!validSmsRecipient(recipient)) { setNotice(t("১১ ডিজিটের মোবাইল নম্বর দিন, অথবা 880 দিয়ে শুরু করুন।", "Enter an 11-digit mobile number or use the 880 format.")); return; }
    if (!message.trim()) { setNotice(t("SMS-এর লেখা দিন।", "Enter an SMS message.")); return; }
    if (!window.confirm(t("এই নম্বরে SMS পাঠাবেন? সেবার চার্জ প্রযোজ্য হবে: ", "Send this SMS? Provider charges apply: ") + recipient.trim())) return;
    const id = requestId ?? crypto.randomUUID();
    setRequestId(id); setSending(true); setNotice("");
    try {
      const result = await send({ data: { recipient, message, requestId: id } });
      setAccepted(result.status === "accepted");
      if (result.status === "accepted") setNotice(t("সেবা SMS গ্রহণ করেছে; ফোনে পৌঁছানো এখনো নিশ্চিত নয়।", "The provider accepted the SMS; delivery is not confirmed yet."));
      else if (result.status === "not_configured") setNotice(t("API কী বা সংরক্ষিত Sender ID নেই। আগে SMS সেটিংস সংরক্ষণ করুন।", "API key or saved sender ID is missing. Save SMS settings first."));
      else if (result.status === "already_submitted") setNotice(t("এই বার্তা আগেই জমা হয়েছে; ইতিহাস দেখুন। আবার পাঠানো হয়নি।", "This submission already exists; check history. It was not sent again."));
      else if (result.status === "history_error") setNotice(t("ইতিহাসে রেকর্ড রাখা যায়নি; SMS পাঠানো হয়নি।", "Could not create a history record; SMS was not sent."));
      else setNotice(t("পাঠানোর ফল নিশ্চিত নয় বা পাঠানো ব্যর্থ হয়েছে; ইতিহাস দেখুন।", "Sending failed or the result is uncertain; check history.") + (result.providerStatus !== null ? t(" সেবার কোড: ", " Provider code: ") + formatNumber(result.providerStatus, lang) : "") + (result.httpStatus !== null ? ` HTTP ${formatNumber(result.httpStatus, lang)}` : ""));
      await cache.invalidateQueries({ queryKey: ["admin-sms-history"] });
    } catch { setNotice(t("অনুরোধের ফল জানা যায়নি। ইতিহাস দেখুন; একই বার্তা আবার পাঠানো হবে না।", "The request result is unavailable. Check history; the same submission will not be sent twice.")); }
    finally { setSending(false); }
  }
  return <section className="mt-8 border-t border-border pt-4">
    <h2 className="text-base font-semibold">{t("নিজের লেখা SMS পাঠান", "Send a custom SMS")}</h2>
    <div className="mt-3 grid gap-4">
      <label>{t("প্রাপকের মোবাইল নম্বর", "Recipient mobile number")}<input type="tel" value={recipient} disabled={sending} onChange={e => { setRecipient(e.target.value); setRequestId(null); setNotice(""); }} placeholder="017XXXXXXXX" className={input} /></label>
      <label>{t("আপনার বার্তা", "Your message")}<textarea rows={4} maxLength={1000} value={message} disabled={sending} onChange={e => { setMessage(e.target.value); setRequestId(null); setNotice(""); }} className={input} /></label>
      <p className="text-xs text-muted-foreground">{formatNumber(message.length, lang)} / {formatNumber(1000, lang)}</p>
      <div><Button type="button" onClick={() => void submit()} disabled={sending || !recipient.trim() || !message.trim()} className="shadow-none"><Send />{sending ? t("পাঠানো হচ্ছে…", "Sending…") : t("SMS পাঠান", "Send SMS")}</Button></div>
      {notice && <p role={accepted ? "status" : "alert"} className={accepted ? "text-sm text-primary" : "text-sm text-destructive"}>{notice}</p>}
    </div>
  </section>;
}