import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka } from "@/lib/locale";
import type { RxItem } from "@/lib/consult";
import { medicineTimingText } from "@/lib/medicine";

/** Patient-facing list of advice their doctors wrote in prescriptions. */
export function DoctorAdvice() {
  const { lang, t } = useLang();
  const { data = [], isLoading } = useQuery({
    queryKey: ["my-advice"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data, error } = await supabase
        .from("prescriptions")
        .select("id, appointment_id, advice, items, follow_up_date, created_at, doctors(name_bn, name_en, specialty)")
        .eq("patient_id", u.user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data.map((r) => ({ ...r, items: (r.items as unknown as RxItem[]) ?? [] }));
    },
  });

  return (
    <section>
      <h1 className="font-display text-3xl font-semibold">{t("ডাক্তারের পরামর্শ", "Doctor's advice")}</h1>
      <div className="mt-5 rounded-[10px] border border-border bg-card">
        {isLoading && <p className="px-5 py-6 text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p>}
        {!isLoading && data.length === 0 && (
          <p className="px-5 py-6 text-muted-foreground">{t("এখনো কোনো পরামর্শ আসেনি। ডাক্তার দেখালে তাঁর পরামর্শ এখানে থাকবে।", "No advice yet. After you see a doctor, their advice will appear here.")}</p>
        )}
        {data.map((r, i) => (
          <article key={r.id} className={`px-5 py-5 ${i ? "border-t border-border" : ""}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-lg font-semibold">{r.doctors ? t(r.doctors.name_bn, r.doctors.name_en) : t("ডাক্তার", "Doctor")}
                {i === 0 && <span className="ml-2 rounded-md border border-primary px-2 py-0.5 align-middle text-xs font-medium text-primary">{t("সর্বশেষ", "Latest")}</span>}
              </p>
              <p className="text-sm text-muted-foreground">{formatDhaka(new Date(r.created_at), lang, { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            {r.advice ? (
              <blockquote className="mt-3 border-l-4 border-accent pl-4 text-lg whitespace-pre-line">{r.advice}</blockquote>
            ) : (
              <p className="mt-3 text-muted-foreground">{t("আলাদা কোনো পরামর্শ লেখা নেই।", "No separate advice written.")}</p>
            )}
            {r.items.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {r.items.map((m, k) => (
                  <li key={k} className="break-words"><span className="font-medium">{m.name}</span> <span className="text-muted-foreground">— {[m.dose, medicineTimingText(m, t), m.duration].filter(Boolean).join(" · ")}</span>{m.comment && <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{t("মন্তব্য", "Comment")}: {m.comment}</p>}</li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              {r.follow_up_date && <p>{t("আবার দেখাবেন", "Follow-up")}: <span className="font-medium">{formatDhaka(new Date(r.follow_up_date), lang, { day: "numeric", month: "long" })}</span></p>}
              <Link to="/prescription/$id" params={{ id: r.appointment_id }} className="text-primary underline underline-offset-4">{t("পুরো প্রেসক্রিপশন দেখুন", "View full prescription")}</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
