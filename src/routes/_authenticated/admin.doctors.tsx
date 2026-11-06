import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatBDT } from "@/lib/locale";
import { SortableTable, type Col } from "@/components/admin/sortable-table";
import { statusInfo } from "@/lib/doctors";

export const Route = createFileRoute("/_authenticated/admin/doctors")({ component: Page });

function Page() {
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: async () => { const { data, error } = await supabase.from("doctors").select("*").order("name_en"); if (error) throw error; return data; },
  });
  type D = (typeof data)[number];
  async function setStatus(d: D, status: D["status"]) {
    const { error } = await supabase.from("doctors").update({ status }).eq("id", d.id);
    if (error) alert(t("বদলানো যায়নি।", "Couldn't update."));
    qc.invalidateQueries({ queryKey: ["admin-doctors"] });
  }
  const cols: Col<D>[] = [
    { key: "name", label: t("নাম", "Name"), value: (d) => (lang === "bn" ? d.name_bn : d.name_en) },
    { key: "deg", label: t("ডিগ্রি", "Degrees"), value: (d) => d.degrees },
    { key: "spec", label: t("বিশেষত্ব", "Specialty"), value: (d) => d.specialty },
    { key: "bmdc", label: "BMDC", value: (d) => d.bmdc_no },
    { key: "fee", label: t("ফি", "Fee"), value: (d) => d.fee_bdt, render: (d) => formatBDT(d.fee_bdt, lang), align: "right" },
    { key: "login", label: t("লগইন যুক্ত", "Login linked"), value: (d) => (d.user_id ? 1 : 0), render: (d) => (d.user_id ? t("হ্যাঁ", "Yes") : "—") },
    { key: "status", label: t("অবস্থা", "Status"), value: (d) => d.status, render: (d) => (
      <select value={d.status} onChange={(e) => setStatus(d, e.target.value as D["status"])} className="rounded-md border border-input bg-card px-1 py-0.5">
        {(["online", "busy", "offline"] as const).map((s) => <option key={s} value={s}>{t(statusInfo[s].bn, statusInfo[s].en)}</option>)}
      </select>
    ) },
  ];
  return (
    <div>
      <h1 className="text-lg font-semibold">{t("ডাক্তার", "Doctors")} <span className="font-normal text-muted-foreground">({data.length})</span></h1>
      <div className="mt-3">{isLoading ? <p className="text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p> : <SortableTable rows={data} cols={cols} rowKey={(d) => d.id} empty={t("কোনো ডাক্তার নেই।", "No doctors.")} />}</div>
    </div>
  );
}
