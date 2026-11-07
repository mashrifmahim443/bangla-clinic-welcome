import { pageHead } from "@/lib/appointments";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { useCms } from "@/lib/cms";
import { INTEGRATIONS_KEY, withDefaults } from "@/lib/integrations";
import { formatBDT, formatDhaka } from "@/lib/locale";
import { specialties } from "@/lib/doctors";
import { SortableTable, type Col } from "@/components/admin/sortable-table";

export const Route = createFileRoute("/_authenticated/admin/applications")({ head: () => pageHead('Doctor application review', 'Review BMDC registration and doctor applications for DiabeCare.'), component: Page });

function Page() {
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const [show, setShow] = useState<"pending" | "all">("pending");
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("doctor_applications").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  type A = (typeof data)[number];
  async function review(a: A, approve: boolean) {
    const note = approve ? null : prompt(t("কেন অনুমোদন হলো না? (আবেদনকারী দেখবেন)", "Why not approved? (the applicant will see this)")) ?? null;
    if (!approve && note === null) return;
    const { error } = await supabase.rpc("review_doctor_application", { _id: a.id, _approve: approve, ...(note ? { _note: note } : {}) });
    if (error) alert(t("সম্পন্ন হয়নি: ", "Failed: ") + error.message);
    qc.invalidateQueries({ queryKey: ["admin-applications"] });
    qc.invalidateQueries({ queryKey: ["admin-doctors"] });
  }
  const rows = show === "pending" ? data.filter((a) => a.status === "pending") : data;
  const cols: Col<A>[] = [
    { key: "date", label: t("তারিখ", "Date"), value: (a) => a.created_at, render: (a) => formatDhaka(new Date(a.created_at), lang, { dateStyle: "medium" }) },
    { key: "name", label: t("নাম", "Name"), value: (a) => (lang === "bn" ? a.name_bn : a.name_en) },
    { key: "deg", label: t("ডিগ্রি", "Degrees"), value: (a) => a.degrees },
    { key: "spec", label: t("বিশেষত্ব", "Specialty"), value: (a) => a.specialty, render: (a) => t(...(specialties[a.specialty] ?? [a.specialty, a.specialty])) },
    { key: "bmdc", label: "BMDC", value: (a) => a.bmdc_no },
    { key: "fee", label: t("ফি", "Fee"), value: (a) => a.fee_bdt, render: (a) => formatBDT(a.fee_bdt, lang), align: "right" },
    { key: "post", label: t("পদবি / কর্মস্থল", "Designation / workplace"), value: (a) => a.designation, render: (a) => <span>{a.designation ?? "—"}<br /><span className="text-muted-foreground">{a.workplace ?? ""}{a.experience_years != null ? ` · ${a.experience_years} ${t("বছর", "yrs")}` : ""}</span></span> },
    { key: "phone", label: t("যোগাযোগ", "Contact"), value: (a) => a.phone, render: (a) => <span className="whitespace-nowrap">{a.phone ?? "—"}<br /><span className="text-muted-foreground">WA {a.whatsapp ?? "—"}</span><br /><span className="text-muted-foreground">{a.email ?? ""}</span></span> },
    { key: "addr", label: t("ঠিকানা", "Address"), value: (a) => a.address },
    { key: "status", label: t("অবস্থা", "Status"), value: (a) => a.status },
    { key: "act", label: t("কাজ", "Action"), value: () => null, render: (a) => a.status !== "pending" ? <span className="text-muted-foreground">{a.admin_note ?? "—"}</span> : (
      <span className="flex gap-3 whitespace-nowrap">
        <button onClick={() => review(a, true)} className="text-glucose-ok underline">{t("অনুমোদন দিন", "Approve")}</button>
        <button onClick={() => review(a, false)} className="text-glucose-low underline">{t("বাতিল করুন", "Reject")}</button>
      </span>
    ) },
  ];
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-lg font-semibold">{t("ডাক্তারের আবেদন", "Doctor applications")} <span className="font-normal text-muted-foreground">({rows.length})</span></h1>
        <div className="flex gap-3 text-[13px]">
          <button onClick={() => setShow("pending")} className={show === "pending" ? "font-semibold text-primary underline" : ""}>{t("অপেক্ষমাণ", "Pending")}</button>
          <button onClick={() => setShow("all")} className={show === "all" ? "font-semibold text-primary underline" : ""}>{t("সব", "All")}</button>
        </div>
      </div>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {t("অনুমোদনের আগে BMDC-র ওয়েবসাইটে নম্বরটা মিলিয়ে নিন:", "Before approving, check the number on the BMDC website:")}{" "}
        <a href={withDefaults(cms.json(INTEGRATIONS_KEY, null)).bmdc_verify} target="_blank" rel="noreferrer" className="text-primary underline">{withDefaults(cms.json(INTEGRATIONS_KEY, null)).bmdc_verify.replace(/^https:\/\//, "")}</a>
      </p>
      <div className="mt-3">{isLoading ? <p className="text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p> : <SortableTable rows={rows} cols={cols} rowKey={(a) => a.id} empty={t("কোনো অপেক্ষমাণ আবেদন নেই।", "No pending applications.")} />}</div>
    </div>
  );
}
