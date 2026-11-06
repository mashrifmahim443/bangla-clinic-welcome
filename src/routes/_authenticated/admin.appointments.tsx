import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatBDT, formatDhaka } from "@/lib/locale";
import { SortableTable, type Col } from "@/components/admin/sortable-table";

export const Route = createFileRoute("/_authenticated/admin/appointments")({ component: Page });

function Page() {
  const { lang, t } = useLang();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-appts"],
    queryFn: async () => {
      const [a, p] = await Promise.all([
        supabase.from("appointments").select("id, slot_start, status, patient_id, doctors(name_bn, name_en, fee_bdt)").order("slot_start", { ascending: false }),
        supabase.from("profiles").select("id, full_name"),
      ]);
      if (a.error) throw a.error;
      const names = new Map((p.data ?? []).map((x) => [x.id, x.full_name]));
      return (a.data ?? []).map((x) => ({ ...x, patient: names.get(x.patient_id) ?? "—" }));
    },
  });
  type A = (typeof data)[number];
  const cols: Col<A>[] = [
    { key: "time", label: t("সময়", "Time"), value: (a) => a.slot_start, render: (a) => formatDhaka(new Date(a.slot_start), lang) },
    { key: "patient", label: t("রোগী", "Patient"), value: (a) => a.patient },
    { key: "doctor", label: t("ডাক্তার", "Doctor"), value: (a) => (lang === "bn" ? a.doctors?.name_bn : a.doctors?.name_en) ?? "" },
    { key: "fee", label: t("ফি", "Fee"), value: (a) => a.doctors?.fee_bdt ?? 0, render: (a) => formatBDT(a.doctors?.fee_bdt ?? 0, lang), align: "right" },
    { key: "status", label: t("অবস্থা", "Status"), value: (a) => a.status },
  ];
  return (
    <div>
      <h1 className="text-lg font-semibold">{t("অ্যাপয়েন্টমেন্ট", "Appointments")} <span className="font-normal text-muted-foreground">({data.length})</span></h1>
      <div className="mt-3">{isLoading ? <p className="text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p> : <SortableTable rows={data} cols={cols} rowKey={(a) => a.id} empty={t("এখনো কোনো অ্যাপয়েন্টমেন্ট নেই।", "No appointments yet.")} />}</div>
    </div>
  );
}
