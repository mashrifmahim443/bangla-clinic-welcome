import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka, formatNumber } from "@/lib/locale";
export function useReviews() {
  return useQuery({ queryKey: ["doctor-reviews"], queryFn: async () => {
    const { data, error } = await supabase.from("doctor_reviews").select("id,doctor_id,rating,body,created_at").order("created_at", { ascending: false });
    if (error) throw error; return data;
  } });
}
export function DoctorRating({ doctorId }: { doctorId: string }) {
  const { lang, t } = useLang(); const { data = [] } = useReviews(); const rows = data.filter(r => r.doctor_id === doctorId);
  return <span className="text-sm text-muted-foreground">{rows.length ? `${formatNumber(Math.round(rows.reduce((a, r) => a + r.rating, 0) / rows.length * 10) / 10, lang)}/5 · ${formatNumber(rows.length, lang)} ${t("রিভিউ", "reviews")}` : t("এখনো রিভিউ নেই", "No reviews yet")}</span>;
}
export function DoctorReviews({ doctorId }: { doctorId: string }) {
  const { lang, t } = useLang(); const { data = [] } = useReviews();
  return <section className="mt-10 border-t border-border pt-5"><h2 className="font-display text-xl font-semibold">{t("রোগীদের রিভিউ", "Patient reviews")}</h2><DoctorRating doctorId={doctorId} />
    {data.filter(r => r.doctor_id === doctorId).map(r => <div key={r.id} className="border-b border-border py-4"><p className="text-sm text-muted-foreground">{formatNumber(r.rating, lang)}/5 · {formatDhaka(new Date(r.created_at), lang, { dateStyle: "medium" })}</p><p className="whitespace-pre-wrap">{r.body}</p></div>)}
  </section>;
}