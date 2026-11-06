import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka } from "@/lib/locale";
import { SortableTable, type Col } from "@/components/admin/sortable-table";
import { adminDeleteUser } from "@/lib/admin.functions";
import type { AppRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: Page });

const statusLabel = { pending: ["অনুমোদনের অপেক্ষায়", "Waiting for approval"], active: ["চালু", "Active"], blocked: ["বন্ধ", "Blocked"] } as const;
const statusColor = { pending: "text-glucose-high", active: "text-glucose-ok", blocked: "text-glucose-low" } as const;
type Status = keyof typeof statusLabel;
const btn = "rounded-md border border-border bg-card px-2 py-0.5 transition-colors duration-150 hover:bg-secondary";

function Page() {
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const del = useServerFn(adminDeleteUser);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | Status | "deletion">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => { const { data, error } = await supabase.rpc("admin_users"); if (error) throw error; return data ?? []; },
  });
  const { data: me } = useQuery({ queryKey: ["me-id"], queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null });
  type U = (typeof data)[number];
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  async function toggle(u: U, role: AppRole) {
    const has = u.roles.includes(role);
    const { error } = has
      ? await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", role)
      : await supabase.from("user_roles").insert({ user_id: u.id, role });
    if (error) alert(`${t("ভূমিকা বদলানো যায়নি।", "Couldn't change the role.")}\n${error.message}`);
    refresh();
  }
  async function setStatus(u: U, s: Status) {
    const { error } = await supabase.rpc("admin_set_account_status", { _user: u.id, _status: s });
    if (error) alert(`${t("বদলানো যায়নি।", "Couldn't change.")}\n${error.message}`);
    refresh();
  }
  async function remove(u: U) {
    const name = u.full_name || u.email;
    if (!confirm(t(`${name}-এর অ্যাকাউন্ট আর সব তথ্য (সুগার, প্রেসক্রিপশন, রিপোর্ট, অ্যাপয়েন্টমেন্ট) চিরতরে মুছে যাবে। ফেরানো যাবে না। মুছবেন?`, `${name}'s account and all data (sugar, prescriptions, reports, appointments) will be erased for good. This can't be undone. Delete?`))) return;
    setBusy(u.id);
    try { await del({ data: { userId: u.id } }); }
    catch (e) { alert(`${t("মোছা যায়নি।", "Couldn't delete.")}\n${e instanceof Error ? e.message : ""}`); }
    setBusy(null);
    refresh();
    qc.invalidateQueries({ queryKey: ["admin-deletion-requests"] });
  }

  const counts = { pending: data.filter((u) => u.account_status === "pending").length, deletion: data.filter((u) => u.deletion_requested).length };
  const rows = data
    .filter((u) => filter === "all" || (filter === "deletion" ? u.deletion_requested : u.account_status === filter))
    .filter((u) => !q || `${u.email} ${u.full_name ?? ""} ${u.phone ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  const cols: Col<U>[] = [
    { key: "name", label: t("নাম", "Name"), value: (u) => u.full_name, render: (u) => <span>{u.full_name ?? "—"}{u.deletion_requested && <span className="ml-1 rounded-sm border border-glucose-low px-1 text-[11px] text-glucose-low">{t("মোছার অনুরোধ", "Deletion requested")}</span>}</span> },
    { key: "email", label: t("ইমেইল", "Email"), value: (u) => u.email },
    { key: "phone", label: t("ফোন", "Phone"), value: (u) => u.phone },
    { key: "created", label: t("যোগ দিয়েছেন", "Joined"), value: (u) => u.created_at, render: (u) => formatDhaka(new Date(u.created_at), lang, { dateStyle: "medium" }) },
    { key: "readings", label: t("রিডিং", "Readings"), value: (u) => Number(u.readings), align: "right" },
    { key: "status", label: t("অবস্থা", "Status"), value: (u) => u.account_status, render: (u) => { const s = u.account_status as Status; return <span className={`font-medium ${statusColor[s]}`}>{t(statusLabel[s][0], statusLabel[s][1])}</span>; } },
    { key: "roles", label: t("ভূমিকা", "Roles"), value: (u) => u.roles.join(","), render: (u) => (
      <span className="flex gap-2">
        {(["patient", "doctor", "admin"] as AppRole[]).map((r) => (
          <label key={r} className="inline-flex items-center gap-1"><input type="checkbox" checked={u.roles.includes(r)} disabled={u.id === me && r === "admin"} onChange={() => toggle(u, r)} />{r}</label>
        ))}
      </span>
    ) },
    { key: "actions", label: t("কাজ", "Actions"), value: () => null, render: (u) => u.id === me ? <span className="text-muted-foreground">{t("আপনি", "You")}</span> : (
      <span className="flex flex-wrap gap-1">
        {u.account_status !== "active" && <button onClick={() => setStatus(u, "active")} className={`${btn} text-glucose-ok`}>{u.account_status === "pending" ? t("অনুমোদন দিন", "Approve") : t("চালু করুন", "Unblock")}</button>}
        {u.account_status !== "blocked" && <button onClick={() => setStatus(u, "blocked")} className={`${btn} text-glucose-high`}>{t("বন্ধ করুন", "Block")}</button>}
        <button disabled={busy === u.id} onClick={() => remove(u)} className={`${btn} text-glucose-low disabled:opacity-50`}>{busy === u.id ? t("মুছছে…", "Deleting…") : t("মুছুন", "Delete")}</button>
      </span>
    ) },
  ];
  const tabs: [typeof filter, string][] = [
    ["all", t("সবাই", "All")],
    ["pending", `${t("অপেক্ষায়", "Pending")} (${counts.pending})`],
    ["active", t("চালু", "Active")],
    ["blocked", t("বন্ধ", "Blocked")],
    ["deletion", `${t("মোছার অনুরোধ", "Deletion requests")} (${counts.deletion})`],
  ];
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-lg font-semibold">{t("ব্যবহারকারী", "Users")} <span className="font-normal text-muted-foreground">({rows.length})</span></h1>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("নাম, ইমেইল বা ফোন খুঁজুন", "Search name, email or phone")} className="w-64 rounded-md border border-input bg-card px-2 py-1 text-[13px]" />
      </div>
      <p className="mt-1 text-muted-foreground">{t("নতুন অ্যাকাউন্ট অনুমোদন পাওয়ার পরেই অ্যাপ ব্যবহার করতে পারবে। বন্ধ অ্যাকাউন্ট কিছুই করতে পারবে না।", "New accounts can use the app only after approval. Blocked accounts can do nothing.")}</p>
      <div className="mt-3 flex flex-wrap gap-1">
        {tabs.map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={`rounded-md border px-2 py-1 transition-colors duration-150 ${filter === k ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}>{l}</button>)}
      </div>
      <div className="mt-3">{isLoading ? <p className="text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p> : <SortableTable rows={rows} cols={cols} rowKey={(u) => u.id} empty={t("কোনো ব্যবহারকারী পাওয়া যায়নি।", "No users found.")} />}</div>
    </div>
  );
}
