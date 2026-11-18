import * as Dialog from "@radix-ui/react-dialog";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { unreadPopups, type PopupAudience } from "@/lib/popup-messages";
import type { AppRole } from "@/lib/roles";

export function AdminPopups({ role }: { role: AppRole }) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const query = useQuery({
    queryKey: ["portal-popups", role], enabled: role !== "admin", refetchInterval: 30000,
    queryFn: async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!auth.user) return [];
      const [messages, dismissals] = await Promise.all([
        supabase.from("popup_messages").select("*").eq("active", true).order("created_at", { ascending: false }),
        supabase.from("popup_dismissals").select("message_id").eq("user_id", auth.user.id),
      ]);
      if (messages.error) throw messages.error;
      if (dismissals.error) throw dismissals.error;
      return unreadPopups((messages.data ?? []).map(m => ({ ...m, audience: m.audience as PopupAudience })), (dismissals.data ?? []).map(d => d.message_id), role);
    },
  });
  const message = query.data?.[0];
  async function dismiss() {
    if (!message || busy) return;
    setBusy(true); setError("");
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error(t("আবার লগইন করুন।", "Please sign in again."));
      const { error } = await supabase.from("popup_dismissals").insert({ message_id: message.id, user_id: auth.user.id });
      if (error && error.code !== "23505") throw error;
      await query.refetch();
    } catch {
      setError(t("বার্তা বন্ধ করা যায়নি। আবার চেষ্টা করুন।", "Could not dismiss this message. Please try again."));
    } finally { setBusy(false); }
  }
  if (!message) return null;
  return <Dialog.Root open onOpenChange={open => { if (!open) void dismiss(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-card p-6 shadow-none">
        <p className="mb-2 text-sm font-medium text-primary">{t("ডায়াকেয়ার থেকে বার্তা", "A message from Diacare")}</p>
        <Dialog.Title className="break-words font-display text-2xl font-semibold">{t(message.title_bn, message.title_en || message.title_bn)}</Dialog.Title>
        <Dialog.Description className="mt-4 max-h-[50vh] overflow-y-auto whitespace-pre-wrap break-words text-base leading-relaxed">{t(message.body_bn, message.body_en || message.body_bn)}</Dialog.Description>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <Button className="mt-6 w-full sm:w-auto" disabled={busy} onClick={() => void dismiss()}>{busy ? t("বন্ধ হচ্ছে…", "Closing…") : t("পড়েছি, বন্ধ করুন", "I've read this, close")}</Button>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}