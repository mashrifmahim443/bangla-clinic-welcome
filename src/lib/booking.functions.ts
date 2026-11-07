import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const bookAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({
    doctorId: z.string().uuid(), slot: z.string().datetime({ offset: true }),
    type: z.enum(["video", "audio", "chat"]), reason: z.string().trim().min(3).max(2000),
    reports: z.array(z.string().uuid()).max(50),
  }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: appointmentId, error } = await context.supabase.rpc("book_appointment", {
      _doctor: data.doctorId, _slot: data.slot, _type: data.type, _reason: data.reason, _reports: data.reports,
    });
    if (error) throw new Error(error.message);
    if (!appointmentId) throw new Error("Appointment was not created");
    // SMS failure never rolls back the booking or invites the patient to book again.
    try {
      const { sendDoctorBookingSms } = await import("./appointment-sms.server");
      return { appointmentId, smsStatus: await sendDoctorBookingSms(appointmentId) };
    } catch {
      console.error("Booking saved; doctor SMS could not be recorded");
      return { appointmentId, smsStatus: "unknown" };
    }
  });