import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka, formatNumber } from "@/lib/locale";

export function SmsHistory() {
  const { t, lang } = useLang();
  const [page, setPage] = useState(0);
  const history = useQuery({ queryKey: ["admin-sms-history", page], queryFn: async () => {
    const { data, error, count } = await supabase.from("sms_history")
      .select("id,sent_at,recipient,provider,http_status,provider_status,delivery_status,delivery_source,delivery_updated_at", { count: "exact" })
      .order("recorded_at", { ascending: false }).order("id", { ascending: false }).range(page * 20, page * 20 + 19);
    if (error) throw error;
    return { rows: data, count: count ?? 0 };
  }});
  const status = (value: string) => {
    switch (value) {
      case "accepted": return t("সেবা গ্রহণ করেছে · ডেলিভারি নিশ্চিত নয়", "Accepted · delivery unconfirmed");
      case "delivered": return t("পৌঁছেছে · সেবা নিশ্চিত করেছে", "Delivered · provider confirmed");
      case "recipient_confirmed": return t("পৌঁছেছে · প্রাপক নিশ্চিত করেছেন", "Received · recipient confirmed");
      case "failed": return t("পাঠানো ব্যর্থ", "Sending failed");
      case "pending": return t("অপেক্ষায়", "Pending");
      default: return t("নিশ্চিত নয়", "Unknown");
    }
  };
  return <section className="mt-8 border-t border-border pt-4">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold">{t("SMS পাঠানোর ইতিহাস", "SMS history")}</h2>
      <Button type="button" variant="outline" size="icon" className="shadow-none" disabled={history.isFetching} aria-label={t("ইতিহাস আবার দেখুন", "Refresh SMS history")} title={t("ইতিহাস আবার দেখুন", "Refresh SMS history")} onClick={() => void history.refetch()}><RefreshCw /></Button>
    </div>
    {history.isLoading ? <p className="mt-3 text-sm">{t("ইতিহাস আসছে…", "Loading history…")}</p> : history.error ? <p role="alert" className="mt-3 text-sm text-destructive">{t("ইতিহাস পড়া যায়নি: ", "Could not load history: ")}{history.error.message}</p> : !history.data?.rows.length ? <p className="mt-3 text-sm text-muted-foreground">{t("এখনো কোনো SMS-এর রেকর্ড নেই।", "No SMS records yet.")}</p> : <>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead><tr className="border-y border-border bg-secondary">
            {[t("পাঠানোর সময়", "Sent at"), t("নম্বর", "Number"), t("সেবার উত্তর", "Provider response"), t("ডেলিভারির অবস্থা", "Delivery status")].map(label => <th key={label} scope="col" className="px-3 py-2 font-medium">{label}</th>)}
          </tr></thead>
          <tbody>{history.data.rows.map(row => <tr key={row.id} className="border-b border-border align-top">
            <td className="px-3 py-3">{row.sent_at ? formatDhaka(new Date(row.sent_at), lang, { dateStyle: "medium", timeStyle: "medium" }) : t("রেকর্ড করা হয়নি (আগের পরীক্ষার SMS)", "Not recorded (earlier test SMS)")}</td>
            <td className="whitespace-nowrap px-3 py-3"><span dir="ltr">{row.recipient}</span></td>
            <td className="px-3 py-3"><p>{row.provider}</p><p>{row.http_status === null ? t("HTTP উত্তর নেই", "No HTTP response") : `HTTP ${formatNumber(row.http_status, lang)}`}</p><p>{row.provider_status === null ? t("সেবার কোড নেই", "No provider code") : t("কোড: ", "Code: ") + formatNumber(row.provider_status, lang)}</p></td>
            <td className={row.delivery_status === "failed" ? "px-3 py-3 text-destructive" : "px-3 py-3"}>{status(row.delivery_status)}{row.delivery_updated_at && <p className="mt-1 text-xs text-muted-foreground">{formatDhaka(new Date(row.delivery_updated_at), lang)}</p>}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button type="button" variant="outline" size="icon" className="shadow-none" disabled={page === 0} aria-label={t("আগের পাতা", "Previous page")} title={t("আগের পাতা", "Previous page")} onClick={() => setPage(page - 1)}><ChevronLeft /></Button>
        <span className="text-sm">{t("পাতা ", "Page ")}{formatNumber(page + 1, lang)}</span>
        <Button type="button" variant="outline" size="icon" className="shadow-none" disabled={(page + 1) * 20 >= history.data.count} aria-label={t("পরের পাতা", "Next page")} title={t("পরের পাতা", "Next page")} onClick={() => setPage(page + 1)}><ChevronRight /></Button>
      </div>
    </>}
  </section>;
}