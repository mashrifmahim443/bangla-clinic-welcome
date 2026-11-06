import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka } from "@/lib/locale";
import { SortableTable, type Col } from "@/components/admin/sortable-table";
import type { AppRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: Page });

function Page() {
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => { const { data, error } = await supabase.rpc("admin_users"); if (error) throw error; return data ?? []; },
  });
  type U = (typeof data)[number];
  async function toggle(u: U, role: AppRole) {
    const has = u.roles.includes(role);
    const { error } = has
      ? await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", role)
      : await supabase.from("user_roles").insert({ user_id: u.id, role });
    if (error) alert(t("বদলানো যায়নি।", "Couldn't change the role."));
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }
  const rows = data.filter((u) => !q || `${u.email} ${u.full_name ?? ""} ${u.phone ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const cols: Col<U>[] = [
    { key: "name", label: t("নাম", "Name"), value: (u) => u.full_name },
    { key: "email", label: t("ইমেইল", "Email"), value: (u) => u.email },
    { key: "phone", label: t("ফোন", "Phone"), value: (u) => u.phone },
    { key: "created", label: t("যোগ দিয়েছেন", "Joined"), value: (u) => u.created_at, render: (u) => formatDhaka(new Date(u.created_at), lang, { dateStyle: "medium" }) },
    { key: "readings", label: t("রিডিং", "Readings"), value: (u) => Number(u.readings), align: "right" },
    { key: "roles", label: t("ভূমিকা", "Roles"), value: (u) => u.roles.join(","), render: (u) => (
      <span className="flex gap-2">
        {(["patient", "doctor", "admin"] as AppRole[]).map((r) => (
          <label key={r} className="inline-flex items-center gap-1"><input type="checkbox" checked={u.roles.includes(r)} onChange={() => toggle(u, r)} />{r}</label>
        ))}
      </span>
    ) },
  ];
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-lg font-semibold">{t("ব্যবহারকারী", "Users")} <span className="font-normal text-muted-foreground">({rows.length})</span></h1>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("নাম, ইমেইল বা ফোন খুঁজুন", "Search name, email or phone")} className="w-64 rounded-md border border-input bg-card px-2 py-1 text-[13px]" />
      </div>
      <div className="mt-3">{isLoading ? <p className="text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p> : <SortableTable rows={rows} cols={cols} rowKey={(u) => u.id} empty={t("কোনো ব্যবহারকারী পাওয়া যায়নি।", "No users found.")} />}</div>
    </div>
  );
}
