import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { formatDhaka } from "@/lib/locale";

export function AppointmentList({ as }: { as: "patient" | "doctor" }) {
  const { lang, t } = useLang();
  const { data = [], isLoading } = useQuery({
    queryKey: ["appointments", as],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      let q = supabase.from("appointments").select("id, slot_start, status, patient_id, doctors(name_bn, name_en, user_id)").order("slot_start", { ascending: false }).limit(30);
      if (as === "patient") q = q.eq("patient_id", u.user?.id ?? "");
      const { data, error } = await q;
      if (error) throw error;
      return as === "doctor" ? data.filter((a) => a.doctors?.user_id === u.user?.id) : data;
    },
  });
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold">{t("অ্যাপয়েন্টমেন্ট", "Appointments")}</h2>
      {isLoading ? <p className="mt-3 text-muted-foreground">{t("লোড হচ্ছে…", "Loading…")}</p> : data.length === 0 ? (
        <p className="mt-3 text-muted-foreground">{t("এখনো কোনো অ্যাপয়েন্টমেন্ট নেই।", "No appointments yet.")}</p>
      ) : (
        <table className="mt-3 w-full border-t border-border text-left">
          <tbody>
            {data.map((a) => (
              <tr key={a.id} className="border-b border-border">
                <td className="py-3 pr-4">{formatDhaka(new Date(a.slot_start), lang, { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="py-3 pr-4">{as === "patient" ? t(a.doctors?.name_bn ?? "", a.doctors?.name_en ?? "") : t("রোগী", "Patient")}</td>
                <td className="py-3 text-right whitespace-nowrap">
                  <Link to="/consult/$id" params={{ id: a.id }} className="text-primary underline underline-offset-4">{t("কক্ষে ঢুকুন", "Enter room")}</Link>
                  <Link to="/prescription/$id" params={{ id: a.id }} className="ml-4 text-primary underline underline-offset-4">{t("প্রেসক্রিপশন", "Prescription")}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
