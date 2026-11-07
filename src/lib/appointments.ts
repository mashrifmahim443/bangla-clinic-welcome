import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const appointmentLabels: Record<string, [string, string]> = {
  pending: ["অনুমোদনের অপেক্ষায়", "Pending"], confirmed: ["নিশ্চিত হয়েছে", "Confirmed"],
  completed: ["সম্পন্ন", "Completed"], cancelled: ["বাতিল", "Cancelled"], no_show: ["রোগী আসেননি", "No show"],
  eligible: ["ফেরতের যোগ্য", "Refund eligible"], admin_review: ["অ্যাডমিন সিদ্ধান্ত নেবেন", "Admin review"],
  approved: ["ফেরত অনুমোদিত", "Refund approved"], declined: ["ফেরত অনুমোদিত নয়", "Refund declined"],
};
export const consultationLabels: Record<string, [string, string]> = { video: ["ভিডিও", "Video"], audio: ["অডিও", "Audio"], chat: ["চ্যাট", "Chat"] };
export function refundEligibility(slot: string, cancelledAt: string) {
  return new Date(slot).getTime() - new Date(cancelledAt).getTime() >= 24 * 3600_000 ? "eligible" : "admin_review";
}
export function canTransition(current: string, next: string, actor: "patient" | "doctor", started: boolean) {
  if (!["pending", "confirmed"].includes(current)) return false;
  if (actor === "patient") return next === "cancelled";
  if (next === "cancelled") return true;
  if (next === "confirmed") return current === "pending";
  return current === "confirmed" && started && ["completed", "no_show"].includes(next);
}
export const fieldClass = "mt-1 w-full rounded-md border border-input bg-card px-3 py-2.5";
export const flatButton = "h-auto min-h-11 whitespace-normal shadow-none";
export function useAppointmentRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase.channel(`appointments-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        for (const key of ["appointments", "available-slots", "appointment", "admin-appts"]) void qc.invalidateQueries({ queryKey: [key] });
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [qc]);
}
export function useDoctorRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase.channel(`doctors-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "doctors" }, () => {
        void qc.invalidateQueries({ queryKey: ["doctors"] }); void qc.invalidateQueries({ queryKey: ["doctor"] });
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [qc]);
}
export function pageHead(title: string, description: string) {
  return { meta: [{ title: `${title} — DiabeCare` }, { name: "description", content: description }, { property: "og:title", content: `${title} — DiabeCare` }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] };
}