import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RxItem = { name: string; dose: string; timing: string; duration: string };

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ["appointment", id],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("appointments")
        .select("id, slot_start, status, patient_id, doctor_id, doctors(id, name_bn, name_en, degrees, specialty, bmdc_no, user_id)")
        .eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const { data: profile } = await supabase.from("profiles").select("full_name, phone, diabetes_type, birth_year").eq("id", data.patient_id).maybeSingle();
      return { ...data, me: u.user?.id ?? "", isDoctor: data.doctors?.user_id === u.user?.id, patient: profile };
    },
  });
}

export function usePrescription(appointmentId: string) {
  return useQuery({
    queryKey: ["prescription", appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase.from("prescriptions").select("*").eq("appointment_id", appointmentId).maybeSingle();
      if (error) throw error;
      return data ? { ...data, items: (data.items as unknown as RxItem[]) ?? [] } : null;
    },
  });
}
