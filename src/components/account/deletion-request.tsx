import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka } from "@/lib/locale";

export function DeletionRequest() {
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const { data: req } = useQuery({
    queryKey: ["my-deletion-request"],
    queryFn: async () => {
      const { data } = await supabase.from("deletion_requests").select("id, status, created_at").eq("status", "open").maybeSingle();
      return data;
    },
  });
  async function send() {
    const { error } = await supabase.from("deletion_requests").insert({ reason: reason.trim() || null });
    if (error) return setErr(`${t("অনুরোধ পাঠানো যায়নি।", "Couldn't send the request.")} ${error.message}`);
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["my-deletion-request"] });
  }
  return (
    <section className="mt-10 rounded-[10px] border border-border bg-card p-5">
      <h2 className="font-display text-xl font-semibold">{t("অ্যাকাউন্ট মুছে ফেলা", "Delete my account")}</h2>
      {req ? (
        <p className="mt-2 text-muted-foreground">{t("আপনার অনুরোধ পেয়েছি", "We received your request on")} {formatDhaka(new Date(req.created_at), lang, { dateStyle: "medium" })}. {t("অ্যাডমিন যাচাই করে আপনার সব তথ্য মুছে দেবেন।", "An admin will check it and erase all your data.")}</p>
      ) : !open ? (
        <>
          <p className="mt-2 text-muted-foreground">{t("অনুরোধ পাঠালে অ্যাডমিন আপনার অ্যাকাউন্ট, সুগারের হিসাব, প্রেসক্রিপশন আর রিপোর্ট চিরতরে মুছে দেবেন।", "If you send a request, an admin will permanently erase your account, sugar log, prescriptions and reports.")}</p>
          <button onClick={() => setOpen(true)} className="mt-3 rounded-md border border-destructive px-4 py-2 font-medium text-destructive transition-colors duration-150 hover:bg-destructive hover:text-primary-foreground">{t("মুছে ফেলার অনুরোধ করুন", "Request deletion")}</button>
        </>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="block font-medium">{t("কারণ (না দিলেও চলবে)", "Reason (optional)")}<textarea rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2" /></label>
          {err && <p className="text-destructive">{err}</p>}
          <div className="flex gap-2">
            <button onClick={send} className="rounded-md bg-destructive px-4 py-2 font-medium text-primary-foreground transition-colors duration-150 hover:bg-destructive/90">{t("অনুরোধ পাঠান", "Send request")}</button>
            <button onClick={() => setOpen(false)} className="rounded-md border border-border px-4 py-2 transition-colors duration-150 hover:bg-secondary">{t("বাতিল", "Cancel")}</button>
          </div>
        </div>
      )}
    </section>
  );
}
