import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka } from "@/lib/locale";

export function Chat({ appointmentId, me }: { appointmentId: string; me: string }) {
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const key = ["messages", appointmentId];
  const { data: msgs = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("consult_messages").select("id, sender_id, body, created_at").eq("appointment_id", appointmentId).order("created_at");
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    const ch = supabase.channel(`consult-${appointmentId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "consult_messages", filter: `appointment_id=eq.${appointmentId}` }, () => qc.invalidateQueries({ queryKey: key }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [msgs.length]);

  const send = useMutation({
    mutationFn: async (body: string) => {
      const { error } = await supabase.from("consult_messages").insert({ appointment_id: appointmentId, body });
      if (error) throw error;
    },
    onSuccess: () => { setText(""); qc.invalidateQueries({ queryKey: key }); },
  });

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-6">
        {msgs.length === 0 && <p className="text-muted-foreground">{t("এখনো কোনো কথা হয়নি। প্রথম বার্তাটা লিখুন।", "No messages yet. Write the first one.")}</p>}
        {msgs.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={`w-fit max-w-[75%] rounded-[10px] px-4 py-2 ${mine ? "ml-auto bg-primary text-primary-foreground" : "border border-border bg-secondary"}`}>
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className={`mt-1 text-xs ${mine ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{formatDhaka(new Date(m.created_at), lang, { timeStyle: "short" })}</p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); const b = text.trim(); if (b) send.mutate(b); }} className="flex gap-2 border-t border-border bg-card p-4">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder={t("বার্তা লিখুন…", "Write a message…")}
          className="flex-1 rounded-md border border-input bg-background px-3 py-2" />
        <button disabled={send.isPending} className="rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors duration-150 hover:bg-primary/90 disabled:opacity-60">{t("পাঠান", "Send")}</button>
      </form>
      {send.isError && <p className="px-4 pb-3 text-sm text-destructive">{t("বার্তাটা যায়নি, আবার চেষ্টা করুন।", "The message didn't send. Try again.")}</p>}
    </section>
  );
}

