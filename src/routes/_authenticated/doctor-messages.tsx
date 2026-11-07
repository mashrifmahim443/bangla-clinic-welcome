import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { RoleShell } from "@/components/site/role-shell";
import { Chat } from "@/components/consult/chat";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka } from "@/lib/locale";
import { pageHead, appointmentLabels } from "@/lib/appointments";
import { isChatOpen, latestByAppointment, useDoctorAppointments, type LastMessage } from "@/lib/doctor-portal";

export const Route = createFileRoute("/_authenticated/doctor-messages")({
  head: () => pageHead("Patient messages", "Chat with your accepted DiabeCare patients."),
  validateSearch: (s: Record<string, unknown>) => ({ a: typeof s.a === "string" ? s.a : undefined }),
  component: Page,
});

function Page() {
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const { a } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState("");
  const { data, isLoading } = useDoctorAppointments();
  const convos = useMemo(() => (data?.list ?? []).filter(x => isChatOpen(x.status)), [data]);
  const ids = convos.map(c => c.id);
  const { data: msgs = [] } = useQuery({ queryKey: ["doctor-last-messages", ids.join(",")], enabled: ids.length > 0, queryFn: async () => {
    const { data, error } = await supabase.from("consult_messages").select("appointment_id,body,created_at,sender_id").in("appointment_id", ids).order("created_at", { ascending: false }).limit(500);
    if (error) throw error; return data as LastMessage[];
  } });
  useEffect(() => {
    const ch = supabase.channel(`doctor-inbox-${crypto.randomUUID()}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "consult_messages" }, () => { void qc.invalidateQueries({ queryKey: ["doctor-last-messages"] }); }).subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [qc]);
  const last = latestByAppointment(msgs);
  const sorted = [...convos].sort((x, y) => (last.get(y.id)?.created_at ?? y.slot_start).localeCompare(last.get(x.id)?.created_at ?? x.slot_start))
    .filter(c => !q.trim() || (c.patientName ?? "").toLowerCase().includes(q.trim().toLowerCase()));
  const active = convos.find(c => c.id === a) ?? null;

  return <RoleShell role="doctor">
    <h1 className="font-display text-3xl font-semibold">{t("রোগীদের বার্তা", "Patient messages")}</h1>
    <p className="mt-1 text-muted-foreground">{t("যাদের অ্যাপয়েন্টমেন্ট আপনি গ্রহণ করেছেন, শুধু তাদের সঙ্গে কথা বলা যায়। অনলাইন পেমেন্ট এখনো চালু নেই।", "You can chat only with patients whose appointment you accepted. Online payment is not enabled yet.")}</p>
    <div className="mt-5 grid h-[calc(100vh-12rem)] min-h-[32rem] overflow-hidden rounded-[10px] border border-border bg-card md:grid-cols-[18rem_1fr]">
      <div className={`flex min-h-0 flex-col border-border md:border-r ${active ? "hidden md:flex" : "flex"}`}>
        <div className="border-b border-border p-3"><input value={q} onChange={e => setQ(e.target.value)} placeholder={t("রোগীর নাম খুঁজুন", "Search patient")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" /></div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {isLoading && <li className="p-4 text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</li>}
          {!isLoading && !sorted.length && <li className="p-4 text-sm text-muted-foreground">{t("এখনো কোনো রোগীর সঙ্গে কথা শুরু হয়নি।", "No patient conversations yet.")}</li>}
          {sorted.map(c => { const m = last.get(c.id); const unread = m && m.sender_id !== data?.me; return <li key={c.id}>
            <button onClick={() => navigate({ search: { a: c.id } })} className={`block w-full border-b border-border px-4 py-3 text-left transition-colors duration-150 hover:bg-secondary ${c.id === a ? "bg-secondary" : ""}`}>
              <div className="flex items-baseline justify-between gap-2"><span className={`truncate ${unread ? "font-semibold" : "font-medium"}`}>{c.patientName || t("রোগী", "Patient")}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDhaka(new Date(m?.created_at ?? c.slot_start), lang, { dateStyle: "short" })}</span></div>
              <p className="truncate text-sm text-muted-foreground">{m ? `${m.sender_id === data?.me ? t("আপনি: ", "You: ") : ""}${m.body}` : (c.reason || t("এখনো বার্তা নেই", "No messages yet"))}</p>
            </button></li>; })}
        </ul>
      </div>
      <div className={`min-h-0 flex-col ${active ? "flex" : "hidden md:flex"}`}>
        {!active ? <p className="m-auto p-6 text-muted-foreground">{t("বাম পাশ থেকে একজন রোগী বেছে নিন।", "Choose a patient on the left.")}</p> : <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="min-w-0"><button className="mr-2 text-sm text-primary underline md:hidden" onClick={() => navigate({ search: {} })}>{t("← সব", "← All")}</button>
              <span className="font-semibold">{active.patientName || t("রোগী", "Patient")}</span>
              <span className="ml-2 text-sm text-muted-foreground">{formatDhaka(new Date(active.slot_start), lang)} · {t(...(appointmentLabels[active.status] ?? [active.status, active.status]))}</span></div>
            <div className="flex gap-3 text-sm">
              <Link to="/consult/$id" params={{ id: active.id }} className="text-primary underline underline-offset-4">{t("পরামর্শ কক্ষ", "Room")}</Link>
              <Link to="/rx-write/$id" params={{ id: active.id }} className="text-primary underline underline-offset-4">{t("প্রেসক্রিপশন", "Prescription")}</Link>
            </div>
          </div>
          <Chat key={active.id} appointmentId={active.id} me={data?.me ?? ""} />
        </>}
      </div>
    </div>
  </RoleShell>;
}
