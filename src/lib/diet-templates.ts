import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMyDoctorId() {
  return useQuery({ queryKey: ["my-doctor-id"], queryFn: async () => (await supabase.rpc("my_doctor_id")).data as string | null });
}

/** Templates a doctor may use: their own (public or private) plus every public one. */
export function useDietTemplates() {
  return useQuery({
    queryKey: ["diet-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("diet_templates").select("*, doctors(name_bn, name_en)").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Patients who have booked with this doctor. */
export function useMyPatients(doctorId: string | null | undefined) {
  return useQuery({
    queryKey: ["my-patients", doctorId],
    enabled: !!doctorId,
    queryFn: async () => {
      const { data: appts } = await supabase.from("appointments").select("id, patient_id, slot_start").eq("doctor_id", doctorId!).order("slot_start", { ascending: false });
      const latest = new Map<string, string>();
      (appts ?? []).forEach((a) => { if (!latest.has(a.patient_id)) latest.set(a.patient_id, a.id); });
      const ids = [...latest.keys()];
      if (!ids.length) return [];
      const { data: ps } = await supabase.from("profiles").select("id, full_name, phone").in("id", ids);
      return ids.map((id) => { const p = ps?.find((x) => x.id === id); return { id, appointmentId: latest.get(id)!, name: p?.full_name || p?.phone || id.slice(0, 8) }; });
    },
  });
}
