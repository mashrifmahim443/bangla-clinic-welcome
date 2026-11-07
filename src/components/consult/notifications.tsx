import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka, formatNumber } from "@/lib/locale";
import { appointmentLabels } from "@/lib/appointments";

export function Notifications() {
  const { lang, t } = useLang(); const qc = useQueryClient(); const [open, setOpen] = useState(false); const [err, setErr] = useState("");
  const { data: user } = useQuery({ queryKey: ["session-user"], queryFn: async () => (await supabase.auth.getUser()).data.user });
  const { data = [] } = useQuery({ queryKey: ["appointment-notifications", user?.id], enabled: !!user, queryFn: async () => {
    if (!user) return [];
    const { data, error } = await supabase.from("appointment_notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    if (error) throw error; return data;
  } });
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`notifications-${crypto.randomUUID()}`).on("postgres_changes", { event: "*", schema: "public", table: "appointment_notifications", filter: `user_id=eq.${user.id}` }, () => { void qc.invalidateQueries({ queryKey: ["appointment-notifications"] }); }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, qc]);
  return <section className="mt-5 border-t border-border pt-4">
    <Button variant="ghost" className="w-full justify-start shadow-none" aria-expanded={open} onClick={() => setOpen(!open)}><Bell strokeWidth={1.5} />{t("নোটিফিকেশন", "Notifications")} · {formatNumber(data.filter(n => !n.read_at).length, lang)}</Button>
    {open && <div className="mt-2 max-h-96 overflow-y-auto text-sm">
      {!data.length && <p className="py-2 text-muted-foreground">{t("নতুন কোনো খবর নেই।", "No updates yet.")}</p>}
      {data.map(n => <div key={n.id} className={`border-b border-border py-3 ${n.read_at ? "text-muted-foreground" : "font-medium"}`}>
        <p>{t(...(appointmentLabels[n.status] ?? [n.status, n.status]))}</p><p>{formatDhaka(new Date(n.slot_start), lang)}</p>
        {n.appointment_id && <Link to="/consult/$id" params={{ id: n.appointment_id }} className="text-primary underline">{t("অ্যাপয়েন্টমেন্ট দেখুন", "View appointment")}</Link>}
        {!n.read_at && <Button variant="link" className="h-auto px-0 py-1 shadow-none" onClick={async () => { const { error } = await supabase.from("appointment_notifications").update({ read_at: new Date().toISOString() }).eq("id", n.id); if (error) setErr(error.message); else void qc.invalidateQueries({ queryKey: ["appointment-notifications"] }); }}>{t("পড়া হয়েছে", "Mark read")}</Button>}
      </div>)}
      {err && <p role="alert" className="text-destructive">{err}</p>}
    </div>}
  </section>;
}