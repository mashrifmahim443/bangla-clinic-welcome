import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka, formatNumber } from "@/lib/locale";
import { appointmentLabels } from "@/lib/appointments";

type Item = { id: string; kind: "status" | "message"; at: string; unread: boolean; title: string; body?: string; appointmentId: string | null };

export function Notifications({ isDoctor }: { isDoctor?: boolean }) {
  const { lang, t } = useLang(); const qc = useQueryClient(); const [err, setErr] = useState("");
  const { data: user } = useQuery({ queryKey: ["session-user"], queryFn: async () => (await supabase.auth.getUser()).data.user });
  const { data: status = [] } = useQuery({ queryKey: ["appointment-notifications", user?.id], enabled: !!user, queryFn: async () => {
    const { data, error } = await supabase.from("appointment_notifications").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50);
    if (error) throw error; return data;
  } });
  // New chat messages from the other person in the last 3 days (RLS limits rows to my own appointments).
  const { data: messages = [] } = useQuery({ queryKey: ["notification-messages", user?.id], enabled: !!user, queryFn: async () => {
    const since = new Date(Date.now() - 3 * 864e5).toISOString();
    const { data, error } = await supabase.from("consult_messages").select("id,appointment_id,body,created_at,sender_id").neq("sender_id", user!.id).gte("created_at", since).order("created_at", { ascending: false }).limit(20);
    if (error) throw error; return data;
  } });
  const seenKey = `dc-msg-seen-${user?.id ?? ""}`;
  const [seenAt, setSeenAt] = useState("");
  useEffect(() => { if (user) setSeenAt(localStorage.getItem(seenKey) ?? ""); }, [user, seenKey]);
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`notifications-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointment_notifications", filter: `user_id=eq.${user.id}` }, () => { void qc.invalidateQueries({ queryKey: ["appointment-notifications"] }); })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "consult_messages" }, () => { void qc.invalidateQueries({ queryKey: ["notification-messages"] }); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [user, qc]);

  const items: Item[] = [
    ...status.map(n => ({ id: n.id, kind: "status" as const, at: n.created_at, unread: !n.read_at, title: t(...(appointmentLabels[n.status] ?? [n.status, n.status])), body: formatDhaka(new Date(n.slot_start), lang), appointmentId: n.appointment_id })),
    ...messages.map(m => ({ id: m.id, kind: "message" as const, at: m.created_at, unread: m.created_at > seenAt, title: t("নতুন বার্তা", "New message"), body: m.body, appointmentId: m.appointment_id })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const unread = items.filter(i => i.unread).length;

  const markAll = async () => {
    const now = new Date().toISOString(); localStorage.setItem(seenKey, now); setSeenAt(now);
    const ids = status.filter(n => !n.read_at).map(n => n.id);
    if (ids.length) { const { error } = await supabase.from("appointment_notifications").update({ read_at: now }).in("id", ids); if (error) setErr(error.message); }
    void qc.invalidateQueries({ queryKey: ["appointment-notifications"] });
  };

  return <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" size="icon" className="relative shadow-none" aria-label={t(`নোটিফিকেশন, ${unread}টি নতুন`, `Notifications, ${unread} new`)}>
        <Bell strokeWidth={1.5} />
        {unread > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-5 rounded-md bg-accent px-1 text-xs font-semibold leading-5 text-accent-foreground">{formatNumber(Math.min(unread, 99), lang)}</span>}
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="font-semibold">{t("নোটিফিকেশন", "Notifications")}</p>
        {unread > 0 && <button onClick={markAll} className="text-sm text-primary underline underline-offset-4">{t("সব পড়া হয়েছে", "Mark all read")}</button>}
      </div>
      <ul className="max-h-[26rem] overflow-y-auto text-sm">
        {!items.length && <li className="px-4 py-6 text-muted-foreground">{t("নতুন কোনো খবর নেই।", "No updates yet.")}</li>}
        {items.map(i => <li key={i.kind + i.id} className={`border-b border-border px-4 py-3 ${i.unread ? "bg-secondary" : ""}`}>
          <div className="flex items-baseline justify-between gap-2">
            <span className={i.unread ? "font-semibold" : "font-medium text-muted-foreground"}>{i.title}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatDhaka(new Date(i.at), lang, { dateStyle: "short", timeStyle: "short" })}</span>
          </div>
          {i.body && <p className="mt-0.5 line-clamp-2 break-words">{i.body}</p>}
          {i.appointmentId && (i.kind === "message" && isDoctor
            ? <Link to="/doctor-messages" search={{ a: i.appointmentId }} className="text-primary underline underline-offset-4">{t("উত্তর দিন", "Reply")}</Link>
            : <Link to="/consult/$id" params={{ id: i.appointmentId }} className="text-primary underline underline-offset-4">{i.kind === "message" ? t("উত্তর দিন", "Reply") : t("অ্যাপয়েন্টমেন্ট দেখুন", "View appointment")}</Link>)}
        </li>)}
      </ul>
      {err && <p role="alert" className="px-4 py-2 text-sm text-destructive">{err}</p>}
    </PopoverContent>
  </Popover>;
}
