import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PlanTable } from "@/components/diet/plan-table";
import { RoleShell } from "@/components/site/role-shell";
import { supabase } from "@/integrations/supabase/client";
import { normalizeCells } from "@/lib/diet-plan";
import { useLang } from "@/lib/i18n";
import { formatDhaka, formatNumber } from "@/lib/locale";

export const Route = createFileRoute("/_authenticated/my-diet")({
  head: () => ({ meta: [{ title: "My diet plan — DiabeCare" }, { name: "description", content: "Read your personal weekly diet plan from your DiabeCare doctor." }, { property: "og:title", content: "My diet plan — DiabeCare" }, { property: "og:description", content: "Read your personal weekly diet plan from your DiabeCare doctor." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { lang, t } = useLang();
  const { data, isLoading } = useQuery({
    queryKey: ["my-diet"],
    queryFn: async () => {
      const uid = (await supabase.auth.getUser()).data.user!.id;
      const { data, error } = await supabase.from("diet_plans").select("*, doctors(name_bn, name_en)").eq("patient_id", uid).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  return (
    <RoleShell role="patient">
      <h1 className="font-display text-3xl font-semibold">{t("আমার খাদ্য তালিকা", "My diet plan")}</h1>
      {isLoading ? <p className="mt-4 text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p> : !data ? (
        <div className="mt-5 max-w-2xl rounded-[10px] border border-border bg-card p-5">
          <p>{t("আপনার জন্য এখনো খাবারের তালিকা তৈরি হয়নি। পরামর্শের সময় ডাক্তার আপনার ওজন, সুগার আর ওষুধের তথ্য দেখে তালিকা বানিয়ে দেবেন।", "No diet plan yet. After a consultation, your doctor will make one from your weight, sugar and medicines.")}</p>
          <div className="mt-4 flex flex-wrap gap-4">
            <Link to="/doctors" className="rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:bg-primary/90">{t("ডাক্তার দেখান", "See a doctor")}</Link>
            <Link to="/diet" className="py-2.5 text-primary underline underline-offset-4">{t("সাধারণ খাদ্য তালিকা দেখুন", "See the general diet chart")}</Link>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-1 text-muted-foreground">
            {data.doctors ? t(data.doctors.name_bn, data.doctors.name_en) : ""} · {t("সর্বশেষ বদলানো হয়েছে", "updated")} {formatDhaka(new Date(data.updated_at), lang, { day: "numeric", month: "long", year: "numeric" })}
            {data.calories ? <> · {t("দিনে প্রায়", "about")} {formatNumber(data.calories, lang)} {t("ক্যালরি", "kcal a day")}</> : null}
          </p>
          {data.notes && <blockquote className="mt-4 max-w-3xl border-l-4 border-accent pl-4 text-lg whitespace-pre-line">{data.notes}</blockquote>}
          <div className="mt-5"><PlanTable cells={normalizeCells(data.cells)} /></div>
          <button onClick={() => window.print()} className="mt-4 rounded-md border border-border px-4 py-2 text-primary hover:bg-secondary">{t("প্রিন্ট করুন", "Print")}</button>
        </>
      )}
    </RoleShell>
  );
}
