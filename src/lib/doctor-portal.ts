import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DoctorAppt = { id: string; slot_start: string; status: string; consultation_type: string; reason: string | null; patient_id: string; patientName: string | null; patientPhone: string | null };
export type LastMessage = { appointment_id: string; body: string; created_at: string; sender_id: string };

/** All appointments for the signed-in doctor, newest slot first, with patient names. */
export function useDoctorAppointments() {
  return useQuery({ queryKey: ["appointments", "doctor-portal"], queryFn: async () => {
    const { data: u } = await supabase.auth.getUser(); if (!u.user) return { me: "", list: [] as DoctorAppt[] };
    const { data: doc } = await supabase.from("doctors").select("id").eq("user_id", u.user.id).maybeSingle();
    if (!doc) return { me: u.user.id, list: [] as DoctorAppt[] };
    const { data, error } = await supabase.from("appointments").select("id,slot_start,status,consultation_type,reason,patient_id").eq("doctor_id", doc.id).order("slot_start", { ascending: false });
    if (error) throw error;
    const ids = [...new Set(data.map(a => a.patient_id))];
    const { data: profiles } = ids.length ? await supabase.from("profiles").select("id,full_name,phone").in("id", ids) : { data: [] };
    return { me: u.user.id, list: data.map(a => { const p = profiles?.find(x => x.id === a.patient_id); return { ...a, patientName: p?.full_name ?? null, patientPhone: p?.phone ?? null }; }) };
  } });
}

/** Patients with an accepted (confirmed or completed) appointment can chat. */
export const isChatOpen = (status: string) => status === "confirmed" || status === "completed";

/** Latest message for each appointment, newest conversation first. */
export function latestByAppointment(messages: LastMessage[]) {
  const out = new Map<string, LastMessage>();
  for (const m of messages) { const prev = out.get(m.appointment_id); if (!prev || prev.created_at < m.created_at) out.set(m.appointment_id, m); }
  return out;
}
